import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  FriendlyModal,
  Icon,
  PosCartLineDisplay,
  PosCartPanel,
  PosCatalogGrid,
  PosCategoryOption,
  PosCustomerOption,
  PosLiquidationSummary,
  PosMiniKpiCard,
  PosPaymentLineInput,
  PosPaymentModal,
  PosProductItemDisplay,
  PosReceiptDianModal,
  PosShiftModal,
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
  PosReceiptProps,
} from '../../domain/models/PosCart.model';
import { PosTerminalUseCases } from '../../application/use-cases/PosTerminalUseCases';
import {
  CustomerDisplayState,
  listenForCustomerDisplayRequests,
  openCustomerDisplayWindow,
  publishCustomerDisplayState,
} from '../sync/CustomerDisplayChannel';

export interface PosTerminalModuleViewProps {
  cashierFullName: string;
  posTerminalUseCases: PosTerminalUseCases;
  catalogUseCases: CatalogUseCases;
  customerUseCases: CustomerUseCases;
}

/**
 * Componente Inteligente (Smart Container Component - Módulo Terminal Caja POS)
 * - Responsabilidad: Orquestar Casos de Uso, estado de dominio y ciclo de vida.
 * - Delega la presentación visual al 100% en Componentes Brutos (Atomic Design en @shared/components).
 */
export const PosTerminalModuleView: React.FC<PosTerminalModuleViewProps> = ({
  cashierFullName,
  posTerminalUseCases,
  catalogUseCases,
  customerUseCases,
}) => {
  // Estado de Dominio
  const [shift, setShift] = useState<CashShiftModel | null>(null);
  const [categories, setCategories] = useState<ProductCategoryModel[]>([]);
  const [products, setProducts] = useState<CatalogItemModel[]>([]);
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<PosReceiptProps[]>([]);

  // Filtros del Catálogo
  const [searchProduct, setSearchProduct] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');

  // Estado del Carrito / Venta
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modales y Avisos
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState<PosReceiptProps | null>(null);
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
    () => customers.find((c) => c.id === selectedCustomerId) ?? customers[0] ?? null,
    [customers, selectedCustomerId]
  );

  const liquidation = useMemo(() => {
    if (!selectedCustomer || cartLines.length === 0) return null;
    return PosCartModel.calculateLiquidation(selectedCustomer, cartLines);
  }, [selectedCustomer, cartLines]);

  const netPayableCop = liquidation?.result.netPayable ?? 0;

  // Acciones del Carrito
  const handleAddProduct = (item: PosProductItemDisplay) => {
    const fullItem = products.find((p) => p.id === item.id);
    if (!fullItem) return;

    const raw = fullItem.raw;
    const taxCode =
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
          codeReference: fullItem.codeReference,
          name: fullItem.name,
          quantity: 1,
          unitPrice: fullItem.basePrice,
          discountPct: 0,
          tributeCode: taxCode,
          taxRate: raw.defaultTaxRate,
          imageUrl: fullItem.primaryImageUrl,
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

  const handleCheckout = async (payments: PosPaymentLineInput[]) => {
    if (!selectedCustomer || !shift) return;

    setIsProcessingPayment(true);
    const res = await posTerminalUseCases.checkoutAndEmitInvoice(shift.isOpen, {
      customer: selectedCustomer,
      lines: cartLines,
      payments,
    });
    setIsProcessingPayment(false);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa el pago antes de cobrar')
      );
      return;
    }

    const receipt = res.getValue();
    setIsPaymentModalOpen(false);
    setCartLines([]);
    await loadTerminalData();
    setActiveReceiptModal(receipt);
  };

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

  // Mapeos a Props de Componentes Brutos
  const displayCartLines: PosCartLineDisplay[] = useMemo(
    () =>
      cartLines.map((l) => ({
        catalogItemId: l.catalogItemId,
        name: l.name,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.quantity * l.unitPrice,
        imageUrl: l.imageUrl,
        isDrink: l.tributeCode === '04',
      })),
    [cartLines]
  );

  const customerOptions: PosCustomerOption[] = useMemo(
    () =>
      customers.map((c) => ({
        id: c.id,
        names: c.names,
        identificationFormatted: c.identificationFormatted,
      })),
    [customers]
  );

  const categoryOptions: PosCategoryOption[] = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        colorHex: cat.colorHex,
      })),
    [categories]
  );

  const productDisplays: PosProductItemDisplay[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
        codeReference: p.codeReference,
        formattedBasePrice: p.formattedBasePrice,
        taxBadgeLabel: p.taxBadgeLabel,
        categoryId: p.categoryId,
        defaultTaxCode: p.raw.defaultTaxCode,
        primaryImageUrl: p.primaryImageUrl,
      })),
    [products]
  );

  const liquidationSummary: PosLiquidationSummary | null = useMemo(() => {
    if (!liquidation) return null;
    return {
      taxableBase: liquidation.result.taxableBase,
      totalTaxes: liquidation.result.totalTaxes,
      totalWithholdings: liquidation.result.totalWithholdings,
      netPayable: liquidation.result.netPayable,
    };
  }, [liquidation]);

  const latestReceiptPreview = useMemo(() => {
    if (recentReceipts.length === 0) return null;
    const r = recentReceipts[0];
    return {
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      customerName: r.customerName,
      paymentMethodLabel: r.paymentMethodLabel,
      netPayableCop: r.taxSummary.netPayable,
    };
  }, [recentReceipts]);

  // Sincronización en tiempo real con la Pantalla de Atención al Cliente (Customer Facing Display)
  const getCurrentCustomerDisplayState = (): CustomerDisplayState => {
    return {
      cashierName: cashierFullName,
      customerName: selectedCustomer ? selectedCustomer.names : 'Consumidor Final',
      lines: cartLines.map((l) => ({
        id: l.catalogItemId,
        name: l.name,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.quantity * l.unitPrice,
        imageUrl: l.imageUrl,
        taxRate: l.taxRate,
      })),
      liquidation: liquidationSummary,
      isPaymentInProgress: isPaymentModalOpen,
      completedReceipt: activeReceiptModal
        ? {
            invoiceNumber: activeReceiptModal.invoiceNumber,
            totalCop: activeReceiptModal.taxSummary.netPayable,
            customerName: activeReceiptModal.customerName,
          }
        : null,
      updatedAt: Date.now(),
    };
  };

  useEffect(() => {
    publishCustomerDisplayState(getCurrentCustomerDisplayState());
  }, [
    cartLines,
    selectedCustomer,
    liquidationSummary,
    isPaymentModalOpen,
    activeReceiptModal,
    cashierFullName,
  ]);

  useEffect(() => {
    const cleanup = listenForCustomerDisplayRequests(() => getCurrentCustomerDisplayState());
    return () => cleanup();
  }, [
    cartLines,
    selectedCustomer,
    liquidationSummary,
    isPaymentModalOpen,
    activeReceiptModal,
    cashierFullName,
  ]);

  if (!shift) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 0. Barra Superior de Control de Terminal & Pantalla Cliente */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
            Terminal de Caja Registradora POS
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            • Cajero en turno: <strong>{cashierFullName}</strong>
          </span>
        </div>

        {/* BOTÓN SOLICITADO: Abrir pantalla cliente */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Icon name="monitor" size={15} />}
          onClick={openCustomerDisplayWindow}
          title="Abrir visor para el cliente en otra pantalla o pestaña"
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#4F55F1',
            borderColor: '#C7D2FE',
            backgroundColor: '#EEF2FF',
          }}
        >
          Abrir pantalla cliente
        </Button>
      </div>

      {/* 1. Componentes Brutos: Fila de Mini KPIs Superiores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <PosMiniKpiCard
          title={`Turno ${shift.shiftCode}`}
          value={CashShiftModel.formatCop(shift.totalShiftSalesCop)}
          badgeLabel={shift.isOpen ? 'Abierto' : 'Cerrado'}
          badgeTone={shift.isOpen ? 'success' : 'danger'}
          icon="store"
          iconBgColor="#EEF2FF"
          iconColor="#4D53F4"
        />
        <PosMiniKpiCard
          title="Efectivo en Gaveta"
          value={CashShiftModel.formatCop(shift.expectedDrawerCashCop)}
          subtext={`Base ${CashShiftModel.formatCop(shift.raw.openingCashCop)}`}
          icon="calculator"
          iconBgColor="#ECFDF5"
          iconColor="#059669"
        />
        <PosMiniKpiCard
          title="Tarjetas & Bre-B QR"
          value={CashShiftModel.formatCop(
            shift.raw.cardSalesCop + shift.raw.transferSalesCop
          )}
          badgeLabel="Digital"
          badgeTone="brand"
          icon="shield"
          iconBgColor="#F3E8FF"
          iconColor="#7C3AED"
        />
        <PosMiniKpiCard
          title="Facturas Emitidas"
          value={`${shift.raw.ticketsCount} facturas`}
          badgeLabel="SETP DIAN"
          badgeTone="warning"
          icon="receipt"
          iconBgColor="#FEF3C7"
          iconColor="#D97706"
        />
      </div>

      {/* 2. Componentes Brutos Organismos: Venta Actual (Izquierda) + Catálogo Táctil (Derecha) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 1.05fr) minmax(420px, 1.65fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <PosCartPanel
          lines={displayCartLines}
          customers={customerOptions}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomerId={setSelectedCustomerId}
          onIncrementLine={(id) => handleUpdateLineQty(id, 1)}
          onDecrementLine={(id) => handleUpdateLineQty(id, -1)}
          onRemoveLine={(id) => handleUpdateLineQty(id, -99999)}
          onClearCart={() => setCartLines([])}
          liquidation={liquidationSummary}
          isShiftOpen={shift.isOpen}
          onOpenCustomerDisplay={openCustomerDisplayWindow}
          onOpenShiftModal={() => {
            setCountedClosingCashText(String(shift.expectedDrawerCashCop));
            setIsShiftModalOpen(true);
          }}
          onPay={() => {
            if (!shift.isOpen) {
              setFriendlyNotice(
                FriendlyErrorMapper.toFriendlyNotice(
                  'El turno de caja se encuentra cerrado. Abre el turno de caja antes de emitir facturas.'
                )
              );
              return;
            }
            setIsPaymentModalOpen(true);
          }}
        />

        <PosCatalogGrid
          categories={categoryOptions}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          searchProduct={searchProduct}
          onSearchChange={setSearchProduct}
          products={productDisplays}
          onAddToCart={handleAddProduct}
          latestReceipt={latestReceiptPreview}
          onOpenReceiptModal={(receiptId) => {
            const found = recentReceipts.find((r) => r.id === receiptId);
            if (found) setActiveReceiptModal(found);
          }}
        />
      </div>

      {/* 3. Modales: Punto de Pago (pagos divididos), Tirilla DIAN y Turno */}
      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        totalCop={netPayableCop}
        isProcessing={isProcessingPayment}
        onConfirm={(payments) => void handleCheckout(payments)}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <PosReceiptDianModal
        receipt={
          activeReceiptModal
            ? {
              ...activeReceiptModal,
              payments: activeReceiptModal.payments.map((p) => ({
                label: PosCartModel.getShortMethodLabel(p.method),
                amountCop: p.amountCop,
              })),
            }
            : null
        }
        onClose={() => setActiveReceiptModal(null)}
      />

      <PosShiftModal
        isOpen={isShiftModalOpen}
        isShiftActive={shift.isOpen}
        shiftCode={shift.shiftCode}
        openingCashCop={shift.raw.openingCashCop}
        cashSalesCop={shift.raw.cashSalesCop}
        expectedDrawerCashCop={shift.expectedDrawerCashCop}
        openingCashInput={openingCashText}
        onChangeOpeningCash={setOpeningCashText}
        countedClosingCashInput={countedClosingCashText}
        onChangeCountedClosingCash={setCountedClosingCashText}
        onConfirmOpenShift={() => void handleOpenShift()}
        onConfirmCloseShift={() => void handleCloseShift()}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* 4. Modal Compartido de Errores Suavizados */}
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
