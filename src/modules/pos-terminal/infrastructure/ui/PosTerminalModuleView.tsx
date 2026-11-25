import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  ColorDot,
  DialogModal,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  SelectField,
  StatMetricCard,
  TrendPill,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import { CatalogUseCases } from '@modules/catalog/application/use-cases/CatalogUseCases';
import { CatalogItemModel } from '@modules/catalog/domain/models/CatalogItem.model';
import { ProductCategoryModel } from '@modules/catalog/domain/models/ProductCategory.model';
import { CustomerUseCases } from '@modules/customers/application/use-cases/CustomerUseCases';
import { CustomerModel } from '@modules/customers/domain/models/Customer.model';
import { CashShiftModel } from '../../domain/models/CashShift.model';
import {
  PosCartLineItem,
  PosCartModel,
  PosPaymentMethod,
  PosReceiptProps,
} from '../../domain/models/PosCart.model';
import { PosTerminalUseCases } from '../../application/use-cases/PosTerminalUseCases';

export interface PosTerminalModuleViewProps {
  cashierFullName: string;
  posTerminalUseCases: PosTerminalUseCases;
  catalogUseCases: CatalogUseCases;
  customerUseCases: CustomerUseCases;
}

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Terminal Caja Registradora POS)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const PosTerminalModuleView: React.FC<PosTerminalModuleViewProps> = ({
  cashierFullName,
  posTerminalUseCases,
  catalogUseCases,
  customerUseCases,
}) => {
  const [shift, setShift] = useState<CashShiftModel | null>(null);
  const [categories, setCategories] = useState<ProductCategoryModel[]>([]);
  const [products, setProducts] = useState<CatalogItemModel[]>([]);
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<PosReceiptProps[]>([]);

  // Filtros del catálogo táctil
  const [searchProduct, setSearchProduct] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');

  // Estado del Ticket / Carrito de Caja
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    'c0000000-0000-4000-8000-000000000001'
  );
  const [cartLines, setCartLines] = useState<PosCartLineItem[]>([
    {
      catalogItemId: 'item-pos-001',
      codeReference: 'CAFE-HUI-500',
      name: 'Café Especial Origen Huila 500g',
      quantity: 2,
      unitPrice: 38500,
      discountPct: 0,
      tributeCode: '04',
      taxRate: 8,
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('CASH');
  const [cashTenderedText, setCashTenderedText] = useState('100000');

  // Modales
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState<PosReceiptProps | null>(
    null
  );
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingCashText, setOpeningCashText] = useState('300000');
  const [countedClosingCashText, setCountedClosingCashText] = useState('');

  const loadTerminalData = async () => {
    const [shiftRes, catRes, prodRes, custRes, recRes] = await Promise.all([
      posTerminalUseCases.getShift(),
      catalogUseCases.getCategories(),
      catalogUseCases.getItems({
        search: searchProduct,
        categoryId: activeCategoryId || undefined,
      }),
      customerUseCases.getCustomers(),
      posTerminalUseCases.getRecentReceipts(),
    ]);

    if (shiftRes.isSuccess) setShift(shiftRes.getValue());
    if (catRes.isSuccess) setCategories(catRes.getValue());
    if (prodRes.isSuccess) setProducts(prodRes.getValue());
    if (custRes.isSuccess) setCustomers(custRes.getValue());
    if (recRes.isSuccess) setRecentReceipts(recRes.getValue());
  };

  useEffect(() => {
    void loadTerminalData();
  }, [searchProduct, activeCategoryId]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((c) => c.id === selectedCustomerId) ??
      customers[0] ??
      null,
    [customers, selectedCustomerId]
  );

  const liquidation = useMemo(() => {
    if (!selectedCustomer || cartLines.length === 0) return null;
    return PosCartModel.calculateLiquidation(selectedCustomer, cartLines);
  }, [selectedCustomer, cartLines]);

  const netPayableCop = liquidation?.result.netPayable ?? 0;
  const cashTenderedCop = Number(cashTenderedText) || 0;
  const changeDueCop =
    paymentMethod === 'CASH'
      ? Math.max(0, cashTenderedCop - netPayableCop)
      : 0;

  // --- Operaciones del Carrito POS ---
  const handleAddProductToCart = (item: CatalogItemModel) => {
    const raw = item.raw;
    const taxCode: '01' | '04' | 'ZZ' =
      raw.isTaxExcluded || raw.defaultTaxCode === 'ZZ'
        ? 'ZZ'
        : raw.defaultTaxCode === '04'
        ? '04'
        : '01';

    setCartLines((prev) => {
      const existing = prev.find((l) => l.catalogItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.catalogItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          catalogItemId: item.id,
          codeReference: item.codeReference,
          name: item.name,
          quantity: 1,
          unitPrice: item.basePrice,
          discountPct: 0,
          tributeCode: taxCode,
          taxRate: raw.defaultTaxRate,
        },
      ];
    });
  };

  const handleUpdateLineQty = (catalogItemId: string, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((line) =>
          line.catalogItemId === catalogItemId
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const handleClearCart = () => {
    setCartLines([]);
  };

  const handleEmitInvoice = async () => {
    if (!selectedCustomer || !shift) return;

    const effectiveCash =
      paymentMethod === 'CASH' ? cashTenderedCop : netPayableCop;

    const res = await posTerminalUseCases.checkoutAndEmitInvoice(shift.isOpen, {
      customer: selectedCustomer,
      lines: cartLines,
      paymentMethod,
      cashTenderedCop: effectiveCash,
    });

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa el ticket antes de cobrar'
        )
      );
      return;
    }

    const receipt = res.getValue();
    setCartLines([]);
    await loadTerminalData();
    setActiveReceiptModal(receipt);
  };

  // --- Apertura y Arqueo/Cierre de Turno de Caja ---
  const handleOpenShift = async () => {
    const res = await posTerminalUseCases.openCashShift(
      Number(openingCashText),
      cashierFullName
    );
    if (res.isFailure) {
      setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
      return;
    }
    setIsShiftModalOpen(false);
    await loadTerminalData();
    setFriendlyNotice({
      title: 'Turno de caja abierto',
      message: `Se inició el turno "${res.getValue().shiftCode}" con una base inicial de ${CashShiftModel.formatCop(Number(openingCashText))}.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleCloseShift = async () => {
    const counted =
      countedClosingCashText === ''
        ? (shift?.expectedDrawerCashCop ?? 0)
        : Number(countedClosingCashText);
    const res = await posTerminalUseCases.closeCashShift(counted);
    if (res.isFailure) {
      setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
      return;
    }
    setIsShiftModalOpen(false);
    await loadTerminalData();
    setFriendlyNotice({
      title: 'Arqueo y cierre de turno completado',
      message: `El turno de caja fue cerrado con un efectivo físico reportado de ${CashShiftModel.formatCop(counted)}.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  if (!shift) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Fila Superior de KPIs del Turno de Caja */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <StatMetricCard
          featured
          title={`Turno ${shift.shiftCode}`}
          value={CashShiftModel.formatCop(shift.totalShiftSalesCop)}
          trendValue={shift.isOpen ? 'TURNO ABIERTO' : 'TURNO CERRADO'}
          trendDirection={shift.isOpen ? 'up' : 'down'}
          comparisonLine1="Total recaudado"
          comparisonLine2="en turno actual"
          icon="store"
        />
        <StatMetricCard
          title="Efectivo en Gaveta"
          value={CashShiftModel.formatCop(shift.expectedDrawerCashCop)}
          trendValue={`Base ${CashShiftModel.formatCop(shift.raw.openingCashCop)}`}
          trendDirection="up"
          comparisonLine1="Base inicial +"
          comparisonLine2="ventas en efectivo"
          icon="calculator"
        />
        <StatMetricCard
          title="Tarjetas & Bre-B QR"
          value={CashShiftModel.formatCop(
            shift.raw.cardSalesCop + shift.raw.transferSalesCop
          )}
          trendValue="Medios Digitales"
          trendDirection="up"
          comparisonLine1="Datáfono y pagos"
          comparisonLine2="inmediatos QR"
          icon="shield"
        />
        <StatMetricCard
          title="Facturas Emitidas"
          value={String(shift.raw.ticketsCount)}
          trendValue="SETP DIAN"
          trendDirection="up"
          comparisonLine1="Comprobantes UBL 2.1"
          comparisonLine2="del turno"
          icon="receipt"
        />
      </div>

      {/* Layout Principal TPV: Catálogo Táctil a la izquierda + Ticket Caja Registradora a la derecha */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.35fr) minmax(350px, 1fr)',
          gap: '22px',
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA: CATÁLOGO TÁCTIL DE MOSTRADOR & HISTORIAL DE TICKETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '22px',
              boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <Typography as="h2" variant="h2">
                  Catálogo Táctil de Mostrador
                </Typography>
                <Typography variant="caption" tone="muted">
                  Toca cualquier producto o escanea su código de barras para agregarlo al ticket
                </Typography>
              </div>

              <Button
                type="button"
                variant={shift.isOpen ? 'outline' : 'primary'}
                size="sm"
                leftIcon={<Icon name="lock" size={14} />}
                onClick={() => {
                  setCountedClosingCashText(String(shift.expectedDrawerCashCop));
                  setIsShiftModalOpen(true);
                }}
              >
                {shift.isOpen ? 'Arqueo / Cerrar Turno' : 'Abrir Turno de Caja'}
              </Button>
            </div>

            <FormField
              placeholder="Escanear código de barras EAN o buscar producto por nombre / SKU..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              leftSlot={<Icon name="barcode" size={18} />}
            />

            {/* Botones Táctiles de Categorías POS */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                type="button"
                size="sm"
                variant={activeCategoryId === '' ? 'primary' : 'outline'}
                onClick={() => setActiveCategoryId('')}
              >
                Todos los Artículos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  size="sm"
                  variant={activeCategoryId === cat.id ? 'primary' : 'outline'}
                  leftIcon={<ColorDot colorHex={cat.colorHex} size={10} />}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Grilla Táctil de Productos POS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))',
                gap: '12px',
              }}
            >
              {products.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAddProductToCart(prod)}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '18px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                      <Badge tone="brand">{prod.codeReference}</Badge>
                      <Badge tone="neutral">{prod.taxBadgeLabel}</Badge>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.3 }}>
                      {prod.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '1.04rem',
                        color: '#4D53F4',
                      }}
                    >
                      {prod.formattedBasePrice}
                    </span>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: '#EEF2FF',
                        color: '#4D53F4',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                      }}
                    >
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Historial de Comprobantes Emitidos en el Turno */}
          {recentReceipts.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '22px',
                boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
                border: '1px solid rgba(226, 232, 240, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <Typography as="h3" variant="h3">
                Últimas Facturas Emitidas en este Turno
              </Typography>
              {recentReceipts.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                        {rec.invoiceNumber}
                      </strong>
                      <Badge tone="success" dot>
                        Validada DIAN
                      </Badge>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      Cliente: {rec.customerName} ({rec.customerIdentification}) • {rec.paymentMethodLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontFamily: 'var(--font-display)', color: '#4D53F4' }}>
                      {CashShiftModel.formatCop(rec.taxSummary.netPayable)}
                    </strong>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="receipt" size={14} />}
                      onClick={() => setActiveReceiptModal(rec)}
                    >
                      Ver Tirilla QR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: TICKET DE VENTA POS & CAJA REGISTRADORA DIAN */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 14px 34px -12px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'sticky',
            top: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography as="h2" variant="h2">
                Ticket de Caja POS
              </Typography>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Resolución DIAN SETP 18760000001
              </span>
            </div>
            {cartLines.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                style={{ color: '#EF4444' }}
              >
                Vaciar
              </Button>
            )}
          </div>

          {/* Selector de Cliente Adquirente DIAN */}
          <SelectField
            label="Cliente / Adquirente DIAN"
            value={selectedCustomer?.id ?? ''}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.names} (${c.identificationFormatted})`,
            }))}
          />

          {/* Renglones del Carrito POS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {cartLines.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px dashed #CBD5E1',
                  color: '#94A3B8',
                  fontSize: '0.84rem',
                }}
              >
                Selecciona artículos del catálogo táctil para armar la venta.
              </div>
            ) : (
              cartLines.map((line) => (
                <div
                  key={line.catalogItemId}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {line.name}
                    </div>
                    <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      $ {line.unitPrice.toLocaleString('es-CO')} c/u •{' '}
                      {line.tributeCode === '04'
                        ? `INC ${line.taxRate}%`
                        : `IVA ${line.taxRate}%`}
                    </span>
                  </div>

                  {/* Controles - / + */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQty(line.catalogItemId, -1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      -
                    </button>
                    <strong style={{ fontSize: '0.86rem', minWidth: '18px', textAlign: 'center' }}>
                      {line.quantity}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQty(line.catalogItemId, 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      +
                    </button>
                  </div>

                  <strong style={{ fontSize: '0.86rem', color: '#0F172A', minWidth: '78px', textAlign: 'right' }}>
                    $ {(line.quantity * line.unitPrice).toLocaleString('es-CO')}
                  </strong>
                </div>
              ))
            )}
          </div>

          {/* Resumen Fiscal DIAN en Vivo */}
          {liquidation && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Subtotal Base:</span>
                <strong>{CashShiftModel.formatCop(liquidation.result.taxableBase)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                <span>+ Impuestos (IVA / INC):</span>
                <strong>+ {CashShiftModel.formatCop(liquidation.result.totalTaxes)}</strong>
              </div>
              {liquidation.result.totalWithholdings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                  <span>- Retenciones Ley (Empresa):</span>
                  <strong>
                    - {CashShiftModel.formatCop(liquidation.result.totalWithholdings)}
                  </strong>
                </div>
              )}
              <Divider margin="4px 0" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                  Total Neto a Cobrar:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.42rem',
                    fontWeight: 800,
                    color: '#4D53F4',
                  }}
                >
                  {CashShiftModel.formatCop(netPayableCop)}
                </span>
              </div>
            </div>
          )}

          {/* Selector de Medio de Pago POS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#0F172A' }}>
              Medio de Pago en Caja
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(
                [
                  { id: 'CASH', label: '💵 Efectivo' },
                  { id: 'CARD', label: '💳 Tarjeta' },
                  { id: 'TRANSFER_BRE_B', label: '📲 Bre-B QR' },
                ] as const
              ).map((pm) => (
                <Button
                  key={pm.id}
                  type="button"
                  size="sm"
                  variant={paymentMethod === pm.id ? 'primary' : 'outline'}
                  onClick={() => setPaymentMethod(pm.id)}
                >
                  {pm.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calculadora de Vueltas en Efectivo */}
          {paymentMethod === 'CASH' && cartLines.length > 0 && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                <FormField
                  type="number"
                  label="Efectivo Recibido (COP)"
                  value={cashTenderedText}
                  onChange={(e) => setCashTenderedText(e.target.value)}
                />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                    Cambio / Vueltas a Devolver
                  </span>
                  <strong
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.22rem',
                      color: cashTenderedCop >= netPayableCop ? '#047857' : '#DC2626',
                    }}
                  >
                    {CashShiftModel.formatCop(changeDueCop)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Exacto', val: netPayableCop },
                  { label: '$50.000', val: 50000 },
                  { label: '$100.000', val: 100000 },
                  { label: '$200.000', val: 200000 },
                ].map((bill) => (
                  <Button
                    key={bill.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCashTenderedText(String(bill.val))}
                    style={{ flex: 1, height: '30px', fontSize: '0.73rem' }}
                  >
                    {bill.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Icon name="receipt" size={18} />}
            onClick={() => void handleEmitInvoice()}
          >
            Facturar y Emitir Tirilla DIAN
          </Button>
        </div>
      </div>

      {/* MODAL 1: REPRESENTACIÓN GRÁFICA TIRILLA / FACTURA ELECTRÓNICA DIAN CON QR Y CUFE */}
      <DialogModal
        isOpen={Boolean(activeReceiptModal)}
        title={`Factura Electrónica de Venta: ${activeReceiptModal?.invoiceNumber ?? ''}`}
        subtitle="Transmitida y validada conforme al Anexo Técnico 1.9 DIAN (UBL 2.1)"
        maxWidth="480px"
        onClose={() => setActiveReceiptModal(null)}
        footer={
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => setActiveReceiptModal(null)}
          >
            Nueva Venta en Caja
          </Button>
        }
      >
        {activeReceiptModal && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              fontSize: '0.82rem',
              color: '#0F172A',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800 }}>
                NATSARSTORE COMERCIAL S.A.S.
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                NIT: 901.882.410-5 • Responsable de IVA • Punto de Venta Central
              </p>
              <p style={{ fontSize: '0.73rem', color: '#64748B' }}>
                Resolución DIAN No. {activeReceiptModal.resolutionNumber}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.79rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Comprobante No.:</span>
                <strong>{activeReceiptModal.invoiceNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Adquirente:</span>
                <strong>{activeReceiptModal.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Identificación:</span>
                <strong>{activeReceiptModal.customerIdentification}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Medio de Pago:</span>
                <strong>{activeReceiptModal.paymentMethodLabel}</strong>
              </div>
            </div>

            <Divider margin="2px 0" />

            {/* Detalle de Renglones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeReceiptModal.lines.map((line) => (
                <div
                  key={line.catalogItemId}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>
                    {line.quantity} x {line.name}
                  </span>
                  <strong>
                    $ {(line.quantity * line.unitPrice).toLocaleString('es-CO')}
                  </strong>
                </div>
              ))}
            </div>

            <Divider margin="2px 0" />

            {/* Totales de la Tirilla */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Subtotal Base:</span>
                <strong>
                  {CashShiftModel.formatCop(activeReceiptModal.taxSummary.taxableBase)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Impuestos (IVA/INC):</span>
                <strong>
                  + {CashShiftModel.formatCop(activeReceiptModal.taxSummary.totalTaxes)}
                </strong>
              </div>
              {activeReceiptModal.taxSummary.totalWithholdings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                  <span>Retenciones Practicadas:</span>
                  <strong>
                    -{' '}
                    {CashShiftModel.formatCop(
                      activeReceiptModal.taxSummary.totalWithholdings
                    )}
                  </strong>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#4D53F4',
                  paddingTop: '4px',
                }}
              >
                <span>TOTAL NETO PAGADO:</span>
                <span>
                  {CashShiftModel.formatCop(activeReceiptModal.taxSummary.netPayable)}
                </span>
              </div>

              {activeReceiptModal.paymentMethod === 'CASH' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#047857' }}>
                  <span>
                    Recibido: {CashShiftModel.formatCop(activeReceiptModal.cashTenderedCop)}
                  </span>
                  <strong>
                    Cambio: {CashShiftModel.formatCop(activeReceiptModal.changeDueCop)}
                  </strong>
                </div>
              )}
            </div>

            {/* Código QR DIAN & Firma Criptográfica CUFE */}
            <div
              style={{
                marginTop: '6px',
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'center',
              }}
            >
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                <rect width="96" height="96" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
                <rect x="10" y="10" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
                <rect x="16" y="16" width="12" height="12" fill="#0F172A" />
                <rect x="62" y="10" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
                <rect x="68" y="16" width="12" height="12" fill="#0F172A" />
                <rect x="10" y="62" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
                <rect x="16" y="68" width="12" height="12" fill="#0F172A" />
                <rect x="42" y="14" width="10" height="10" fill="#4D53F4" />
                <rect x="40" y="40" width="16" height="16" rx="3" fill="#4D53F4" />
                <rect x="64" y="44" width="18" height="8" fill="#0F172A" />
                <rect x="42" y="66" width="12" height="18" fill="#0F172A" />
                <rect x="62" y="62" width="22" height="22" rx="4" stroke="#4D53F4" strokeWidth="4" />
              </svg>

              <div style={{ width: '100%' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block' }}>
                  CUFE (SHA-384 DIAN UBL 2.1):
                </span>
                <code
                  style={{
                    display: 'block',
                    fontSize: '0.66rem',
                    color: '#64748B',
                    wordBreak: 'break-all',
                    marginTop: '3px',
                  }}
                >
                  {activeReceiptModal.cufe}
                </code>
              </div>
            </div>
          </div>
        )}
      </DialogModal>

      {/* MODAL 2: APERTURA O ARQUEO Y CIERRE DE TURNO DE CAJA */}
      <DialogModal
        isOpen={isShiftModalOpen}
        title={
          shift.isOpen
            ? `Arqueo y Cierre de Turno (${shift.shiftCode})`
            : 'Apertura de Nuevo Turno de Caja POS'
        }
        subtitle={
          shift.isOpen
            ? 'Verifica el efectivo físico en gaveta antes de cerrar el turno del cajero'
            : 'Registra el fondo base en efectivo para habilitar la facturación en mostrador'
        }
        maxWidth="500px"
        onClose={() => setIsShiftModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)}>
              Cancelar
            </Button>
            {shift.isOpen ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleCloseShift()}
              >
                Confirmar Arqueo y Cerrar Turno
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleOpenShift()}
              >
                Abrir Turno de Caja
              </Button>
            )}
          </>
        }
      >
        {shift.isOpen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Base Inicial Apertura:</span>
                <strong>{CashShiftModel.formatCop(shift.raw.openingCashCop)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>+ Ventas en Efectivo:</span>
                <strong>{CashShiftModel.formatCop(shift.raw.cashSalesCop)}</strong>
              </div>
              <Divider margin="4px 0" />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4D53F4' }}>
                <span style={{ fontWeight: 700 }}>Efectivo Esperado en Gaveta:</span>
                <strong>{CashShiftModel.formatCop(shift.expectedDrawerCashCop)}</strong>
              </div>
            </div>

            <FormField
              type="number"
              label="Efectivo Físico Contado en Gaveta (COP)*"
              value={countedClosingCashText}
              onChange={(e) => setCountedClosingCashText(e.target.value)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField
              type="number"
              label="Saldo Base Inicial en Efectivo (COP)*"
              value={openingCashText}
              onChange={(e) => setOpeningCashText(e.target.value)}
            />
          </div>
        )}
      </DialogModal>

      {/* MODAL COMPARTIDO PARA SUAVIZAR ERRORES Y AVISOS AL CLIENTE */}
      <FriendlyModal
        isOpen={Boolean(friendlyNotice)}
        title={friendlyNotice?.title ?? ''}
        message={friendlyNotice?.message ?? ''}
        tone={friendlyNotice?.tone}
        actionLabel={friendlyNotice?.actionLabel}
        onClose={() => setFriendlyNotice(null)}
      />
    </div>
  );
};
