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
      {/* Fila Superior de KPIs del Turno de Caja (Versión Ultra-Compacta para Priorizar la Caja) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* KPI 1: Turno */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '10px 14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EEF2FF',
              color: '#4D53F4',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="store" size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Turno {shift.shiftCode}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: shift.isOpen ? '#ECFDF5' : '#FEF2F2',
                  color: shift.isOpen ? '#059669' : '#DC2626',
                }}
              >
                {shift.isOpen ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {CashShiftModel.formatCop(shift.totalShiftSalesCop)}
            </div>
          </div>
        </div>

        {/* KPI 2: Efectivo en Gaveta */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '10px 14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="calculator" size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Efectivo en Gaveta
              </span>
              <span style={{ fontSize: '0.62rem', color: '#64748B' }}>
                Base {CashShiftModel.formatCop(shift.raw.openingCashCop)}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {CashShiftModel.formatCop(shift.expectedDrawerCashCop)}
            </div>
          </div>
        </div>

        {/* KPI 3: Tarjetas & Bre-B */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '10px 14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#F3E8FF',
              color: '#7C3AED',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="shield" size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Tarjetas & Bre-B QR
              </span>
              <span style={{ fontSize: '0.62rem', color: '#7C3AED', fontWeight: 700 }}>
                Digital
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {CashShiftModel.formatCop(
                shift.raw.cardSalesCop + shift.raw.transferSalesCop
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Facturas Emitidas */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '10px 14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="receipt" size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Facturas Emitidas
              </span>
              <span style={{ fontSize: '0.62rem', color: '#D97706', fontWeight: 700 }}>
                SETP DIAN
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {shift.raw.ticketsCount} facturas
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal TPV Inspirado en PosyMart: Venta Actual a la Izquierda + Catálogo Táctil a la Derecha */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 1.05fr) minmax(420px, 1.65fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA: VENTA ACTUAL (CURRENT SALE) / TICKET DE CAJA */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '22px',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.07)',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'sticky',
            top: '20px',
          }}
        >
          {/* Cabecera del Ticket */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography as="h2" variant="h2" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Venta Actual
              </Typography>
              <Badge tone="brand">
                {cartLines.reduce((acc, l) => acc + l.quantity, 0)} artículos
              </Badge>
            </div>

            <Button
              type="button"
              variant={shift.isOpen ? 'outline' : 'primary'}
              size="sm"
              leftIcon={<Icon name="lock" size={13} />}
              onClick={() => {
                setCountedClosingCashText(String(shift.expectedDrawerCashCop));
                setIsShiftModalOpen(true);
              }}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              {shift.isOpen ? 'Arqueo Turno' : 'Abrir Turno'}
            </Button>
          </div>

          {/* Selector Rápido de Cliente DIAN */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Adquirente / Factura DIAN
              </span>
              <span style={{ fontSize: '0.68rem', color: '#4D53F4', fontWeight: 700 }}>
                {selectedCustomer?.identificationFormatted}
              </span>
            </div>
            <select
              value={selectedCustomer?.id ?? ''}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0F172A',
                outline: 'none',
              }}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.names} ({c.identificationFormatted})
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Productos en la Venta (Scrollable) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {cartLines.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px dashed #CBD5E1',
                  color: '#94A3B8',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="package" size={26} style={{ color: '#CBD5E1' }} />
                <span>La canasta está vacía. Selecciona productos del menú para comenzar.</span>
              </div>
            ) : (
              cartLines.map((line) => (
                <div
                  key={line.catalogItemId}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Miniatura visual del producto */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#EEF2FF',
                      color: '#4D53F4',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      flexShrink: 0,
                    }}
                  >
                    {line.tributeCode === '04' ? '☕' : '📦'}
                  </div>

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
                      title={line.name}
                    >
                      {line.name}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      $ {line.unitPrice.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Selector - / + */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQty(line.catalogItemId, -1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        minWidth: '20px',
                        textAlign: 'center',
                      }}
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQty(line.catalogItemId, 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal del Renglón */}
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      color: '#0F172A',
                      minWidth: '72px',
                      textAlign: 'right',
                    }}
                  >
                    $ {(line.quantity * line.unitPrice).toLocaleString('es-CO')}
                  </div>

                  {/* Botón Borrar */}
                  <button
                    type="button"
                    onClick={() => handleUpdateLineQty(line.catalogItemId, -line.quantity)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="Eliminar de la venta"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desglose Financiero & Total */}
          {liquidation && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Subtotal Base:</span>
                <strong>{CashShiftModel.formatCop(liquidation.result.taxableBase)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                <span>Impuestos (IVA / INC):</span>
                <strong>+ {CashShiftModel.formatCop(liquidation.result.totalTaxes)}</strong>
              </div>
              {liquidation.result.totalWithholdings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                  <span>Retenciones:</span>
                  <strong>- {CashShiftModel.formatCop(liquidation.result.totalWithholdings)}</strong>
                </div>
              )}
              <Divider margin="4px 0" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                  Total a Pagar:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#4D53F4',
                  }}
                >
                  {CashShiftModel.formatCop(netPayableCop)}
                </span>
              </div>
            </div>
          )}

          {/* Medios de Pago */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Medio de Pago
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
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
                  style={{ fontSize: '0.76rem', height: '32px' }}
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
                padding: '10px 12px',
                borderRadius: '14px',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                <FormField
                  type="number"
                  label="Efectivo Recibido"
                  value={cashTenderedText}
                  onChange={(e) => setCashTenderedText(e.target.value)}
                />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                    Vueltas / Cambio
                  </span>
                  <strong
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      color: cashTenderedCop >= netPayableCop ? '#047857' : '#DC2626',
                    }}
                  >
                    {CashShiftModel.formatCop(changeDueCop)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px' }}>
                {[
                  { label: 'Exacto', val: netPayableCop },
                  { label: '$50k', val: 50000 },
                  { label: '$100k', val: 100000 },
                  { label: '$200k', val: 200000 },
                ].map((bill) => (
                  <Button
                    key={bill.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCashTenderedText(String(bill.val))}
                    style={{ flex: 1, height: '28px', fontSize: '0.7rem', padding: '0 4px', backgroundColor: '#FFFFFF' }}
                  >
                    {bill.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción: Vaciar y Pagar/Facturar */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {cartLines.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClearCart}
                style={{
                  color: '#64748B',
                  borderColor: '#CBD5E1',
                  minWidth: '110px',
                }}
              >
                Vaciar
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={cartLines.length === 0}
              leftIcon={<Icon name="receipt" size={18} />}
              onClick={() => void handleEmitInvoice()}
              style={{
                boxShadow: '0 8px 20px rgba(77, 83, 244, 0.35)',
                fontSize: '0.94rem',
                fontWeight: 700,
              }}
            >
              {cartLines.length > 0
                ? `Cobrar ${CashShiftModel.formatCop(netPayableCop)}`
                : 'Cobrar Venta'}
            </Button>
          </div>
        </div>

        {/* COLUMNA DERECHA: CATÁLOGO TÁCTIL DE PRODUCTOS (GRID CON TARJETAS MINIMALISTAS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '22px',
              boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Buscador de Productos y Código de Barras */}
            <FormField
              placeholder="Buscar producto por nombre, SKU o escanear código de barras..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              leftSlot={<Icon name="search" size={18} />}
            />

            {/* Píldoras de Categorías (Estilo PosyMart) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveCategoryId('')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: activeCategoryId === '' ? '#4D53F4' : '#F1F5F9',
                  color: activeCategoryId === '' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.16s ease',
                }}
              >
                Todos
              </button>

              {categories.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: isActive ? '#4D53F4' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <ColorDot colorHex={cat.colorHex} size={8} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Grilla de Tarjetas de Productos (Estilo PosyMart con Ilustración, Nombre, Precio y Botón '+') */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              {products.map((prod) => {
                const isFoodOrDrink = prod.raw.defaultTaxCode === '04' || prod.categoryId === 'cat-cafe-002';
                const isHardware = prod.categoryId === 'cat-hardware-003';

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProductToCart(prod)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px 14px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(77, 83, 244, 0.12)';
                      e.currentTarget.style.borderColor = '#C7D2FE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.03)';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                  >
                    {/* Ilustración / Miniatura Circular Central (como en el PosyMart) */}
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: isFoodOrDrink
                          ? '#FEF3C7'
                          : isHardware
                          ? '#EEF2FF'
                          : '#ECFDF5',
                        color: isFoodOrDrink
                          ? '#D97706'
                          : isHardware
                          ? '#4D53F4'
                          : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        fontSize: '1.9rem',
                        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      {prod.primaryImageUrl ? (
                        <img
                          src={prod.primaryImageUrl}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : isFoodOrDrink ? (
                        '☕'
                      ) : isHardware ? (
                        <Icon name="package" size={30} />
                      ) : (
                        <Icon name="sparkles" size={28} />
                      )}
                    </div>

                    {/* Título & Detalle */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          color: '#0F172A',
                          lineHeight: 1.25,
                          minHeight: '34px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {prod.name}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#94A3B8',
                          marginTop: '3px',
                          display: 'inline-block',
                        }}
                      >
                        {prod.taxBadgeLabel}
                      </span>
                    </div>

                    {/* Precio y Botón Circular '+' (Estilo exacto de la referencia) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: '#0F172A',
                        }}
                      >
                        {prod.formattedBasePrice}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProductToCart(prod);
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: '#4D53F4',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(77, 83, 244, 0.3)',
                          transition: 'transform 0.12s ease',
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial Plegable de Comprobantes Emitidos en el Turno */}
          {recentReceipts.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '16px 20px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                border: '1px solid rgba(226, 232, 240, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
                  Última Factura Emitida: {recentReceipts[0]?.invoiceNumber}
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  {recentReceipts[0]?.customerName} • {recentReceipts[0]?.paymentMethodLabel}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong style={{ fontFamily: 'var(--font-display)', color: '#4D53F4', fontSize: '0.95rem' }}>
                  {CashShiftModel.formatCop(recentReceipts[0]?.taxSummary.netPayable ?? 0)}
                </strong>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Icon name="receipt" size={13} />}
                  onClick={() => setActiveReceiptModal(recentReceipts[0])}
                >
                  Ver Tirilla QR
                </Button>
              </div>
            </div>
          )}
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
