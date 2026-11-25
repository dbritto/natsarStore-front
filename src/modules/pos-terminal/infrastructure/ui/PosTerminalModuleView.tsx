import React, { useEffect, useMemo, useState } from 'react';
import {
  FriendlyModal,
  PosCartLineDisplay,
  PosCartPanel,
  PosCatalogGrid,
  PosCategoryOption,
  PosCustomerOption,
  PosLiquidationSummary,
  PosMiniKpiCard,
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
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('CASH');
  const [cashTenderedText, setCashTenderedText] = useState('100000');

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
  const cashTenderedCop = Number(cashTenderedText) || 0;
  const changeDueCop =
    paymentMethod === 'CASH' ? Math.max(0, cashTenderedCop - netPayableCop) : 0;

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

  const handleCheckout = async () => {
    if (!selectedCustomer || !shift) return;

    const effectiveCash = paymentMethod === 'CASH' ? cashTenderedCop : netPayableCop;

    const res = await posTerminalUseCases.checkoutAndEmitInvoice(shift.isOpen, {
      customer: selectedCustomer,
      lines: cartLines,
      paymentMethod,
      cashTenderedCop: effectiveCash,
    });

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa el ticket antes de cobrar')
      );
      return;
    }

    const receipt = res.getValue();
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

  if (!shift) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          paymentMethod={paymentMethod}
          onSelectPaymentMethod={setPaymentMethod}
          cashTenderedText={cashTenderedText}
          onChangeCashTendered={setCashTenderedText}
          changeDueCop={changeDueCop}
          isShiftOpen={shift.isOpen}
          onOpenShiftModal={() => {
            setCountedClosingCashText(String(shift.expectedDrawerCashCop));
            setIsShiftModalOpen(true);
          }}
          onCheckout={() => void handleCheckout()}
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

      {/* 3. Componentes Brutos Modales: Tirilla DIAN y Turno */}
      <PosReceiptDianModal
        receipt={activeReceiptModal}
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
