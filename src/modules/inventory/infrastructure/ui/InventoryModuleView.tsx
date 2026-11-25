import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  DialogModal,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  SelectField,
  StatMetricCard,
  TabSwitcher,
  TrendPill,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  SaveWarehouseDraft,
  WarehouseModel,
  WarehouseType,
} from '../../domain/models/Warehouse.model';
import {
  StockBalanceModel,
  UpdateThresholdsDraft,
} from '../../domain/models/StockBalance.model';
import {
  InventoryReasonDto,
  KardexMovementModel,
  RegisterMovementDraft,
} from '../../domain/models/KardexMovement.model';
import { InventoryUseCases } from '../../application/use-cases/InventoryUseCases';

export interface InventoryModuleViewProps {
  inventoryUseCases: InventoryUseCases;
}

type InventoryTabId = 'balances' | 'kardex' | 'warehouses';

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Inventario, Bodegas y Kárdex)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const InventoryModuleView: React.FC<InventoryModuleViewProps> = ({
  inventoryUseCases,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTabId>('balances');
  const [warehouses, setWarehouses] = useState<WarehouseModel[]>([]);
  const [reasons, setReasons] = useState<InventoryReasonDto[]>([]);
  const [balances, setBalances] = useState<StockBalanceModel[]>([]);
  const [kardex, setKardex] = useState<KardexMovementModel[]>([]);

  // Filtros de Saldos y Kárdex
  const [searchBalance, setSearchBalance] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [filterReasonCode, setFilterReasonCode] = useState('');

  // Modal amigable para errores y avisos al cliente
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Modal 1: Registrar Movimiento de Inventario (Entrada / Salida / Merma)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementDraft, setMovementDraft] = useState<RegisterMovementDraft>({
    warehouseId: '',
    catalogItemId: 'item-pos-001',
    reasonCode: 'PURCHASE_ENTRY',
    quantity: 10,
    unitCost: 16500,
    referenceCode: '',
    notes: '',
  });

  // Modal 2: Configurar Umbrales de Stock Mínimo (PATCH /api/v1/inventory/balances/thresholds)
  const [editingThresholdBalance, setEditingThresholdBalance] =
    useState<StockBalanceModel | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState<UpdateThresholdsDraft>({
    warehouseId: '',
    catalogItemId: '',
    minStock: 5,
    maxStock: 100,
    lowStockAlertEnabled: true,
    leadTimeDays: 3,
    safetyStock: 2,
  });

  // Modal 3: Crear / Editar Bodega (/api/v1/inventory/warehouses)
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [warehouseDraft, setWarehouseDraft] = useState<SaveWarehouseDraft>({
    code: '',
    name: '',
    description: '',
    warehouseType: 'POS_STORE',
    isDefaultPos: false,
    isActive: true,
  });

  const loadAllInventoryData = async () => {
    const [whRes, reasonRes, balRes, kdxRes] = await Promise.all([
      inventoryUseCases.getWarehouses(),
      inventoryUseCases.getReasons(),
      inventoryUseCases.getBalances({
        warehouseId: filterWarehouseId || undefined,
        lowStockOnly,
        search: searchBalance,
      }),
      inventoryUseCases.getKardex({
        warehouseId: filterWarehouseId || undefined,
        reasonCode: filterReasonCode || undefined,
      }),
    ]);

    if (whRes.isSuccess) setWarehouses(whRes.getValue());
    if (reasonRes.isSuccess) setReasons(reasonRes.getValue());
    if (balRes.isSuccess) setBalances(balRes.getValue());
    if (kdxRes.isSuccess) setKardex(kdxRes.getValue());
  };

  useEffect(() => {
    void loadAllInventoryData();
  }, [filterWarehouseId, lowStockOnly, searchBalance, filterReasonCode]);

  const kpis = useMemo(() => {
    const totalValuation = balances.reduce((acc, b) => acc + b.totalValuationCop, 0);
    const lowStockCount = balances.filter((b) => b.isLowStock).length;
    const totalUnits = balances.reduce((acc, b) => acc + b.qtyAvailable, 0);
    return {
      formattedValuation: `$ ${totalValuation.toLocaleString('es-CO')}`,
      totalUnits: totalUnits.toLocaleString('es-CO'),
      lowStockCount,
      warehousesCount: warehouses.length,
      kardexCount: kardex.length,
    };
  }, [balances, warehouses, kardex]);

  // Catálogo único de productos presentes en saldos para el selector de movimientos
  const distinctCatalogProducts = useMemo(() => {
    const map = new Map<string, { id: string; label: string; avgCost: number }>();
    balances.forEach((b) => {
      if (!map.has(b.catalogItemId)) {
        map.set(b.catalogItemId, {
          id: b.catalogItemId,
          label: `${b.codeReference} — ${b.productName}`,
          avgCost: b.averageCost,
        });
      }
    });
    if (map.size === 0) {
      map.set('item-pos-001', {
        id: 'item-pos-001',
        label: 'CAFE-HUI-500 — Café Especial Origen Huila 500g',
        avgCost: 16500,
      });
    }
    return Array.from(map.values());
  }, [balances]);

  const openMovementModal = (preset?: {
    warehouseId?: string;
    catalogItemId?: string;
    unitCost?: number;
  }) => {
    const defaultWh = preset?.warehouseId || warehouses[0]?.id || 'wh-pos-central-01';
    const defaultItem =
      preset?.catalogItemId || distinctCatalogProducts[0]?.id || 'item-pos-001';
    const defaultCost =
      preset?.unitCost ??
      distinctCatalogProducts.find((p) => p.id === defaultItem)?.avgCost ??
      16500;

    setMovementDraft({
      warehouseId: defaultWh,
      catalogItemId: defaultItem,
      reasonCode: reasons[0]?.code ?? 'PURCHASE_ENTRY',
      quantity: 10,
      unitCost: defaultCost,
      referenceCode: '',
      notes: '',
    });
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = async () => {
    const res = await inventoryUseCases.createMovement(movementDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'No fue posible registrar el movimiento'
        )
      );
      return;
    }

    setIsMovementModalOpen(false);
    await loadAllInventoryData();
    const mov = res.getValue();
    setFriendlyNotice({
      title: mov.isEntry ? 'Entrada de inventario registrada' : 'Salida de inventario registrada',
      message: `Se aplicó el movimiento (${mov.formattedQtyDelta} uds) sobre "${mov.props.productName}". Nuevo saldo en bodega: ${mov.props.balanceAfter} uds.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const openThresholdsModal = (balance: StockBalanceModel) => {
    setEditingThresholdBalance(balance);
    setThresholdDraft({
      warehouseId: balance.warehouseId,
      catalogItemId: balance.catalogItemId,
      minStock: balance.minStock,
      maxStock: balance.maxStock,
      lowStockAlertEnabled: balance.lowStockAlertEnabled,
      leadTimeDays: balance.raw.leadTimeDays ?? 3,
      safetyStock: balance.raw.safetyStock ?? 2,
    });
  };

  const handleSaveThresholds = async () => {
    const res = await inventoryUseCases.saveThresholds(thresholdDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa los umbrales de stock')
      );
      return;
    }

    setEditingThresholdBalance(null);
    await loadAllInventoryData();
    setFriendlyNotice({
      title: 'Umbrales de stock actualizados',
      message: 'La configuración de stock mínimo y alertas fue guardada para esta bodega.',
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const openCreateWarehouseModal = () => {
    setEditingWarehouseId(null);
    setWarehouseDraft({
      code: '',
      name: '',
      description: '',
      warehouseType: 'POS_STORE',
      isDefaultPos: false,
      isActive: true,
    });
    setIsWarehouseModalOpen(true);
  };

  const openEditWarehouseModal = (wh: WarehouseModel) => {
    setEditingWarehouseId(wh.id);
    setWarehouseDraft({
      code: wh.code,
      name: wh.name,
      description: wh.description ?? '',
      warehouseType: wh.warehouseType,
      isDefaultPos: wh.isDefaultPos,
      isActive: wh.isActive,
    });
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async () => {
    const res = editingWarehouseId
      ? await inventoryUseCases.updateWarehouse(editingWarehouseId, warehouseDraft)
      : await inventoryUseCases.createWarehouse(warehouseDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa los datos de la bodega')
      );
      return;
    }

    setIsWarehouseModalOpen(false);
    await loadAllInventoryData();
    setFriendlyNotice({
      title: editingWarehouseId ? 'Bodega actualizada' : 'Bodega creada',
      message: `La bodega "${res.getValue().name}" fue registrada exitosamente.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteWarehouse = async (wh: WarehouseModel) => {
    const res = await inventoryUseCases.deleteWarehouse(wh);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Bodega protegida')
      );
      return;
    }
    await loadAllInventoryData();
  };

  const selectedReasonObj = useMemo(
    () => reasons.find((r) => r.code === movementDraft.reasonCode),
    [reasons, movementDraft.reasonCode]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Fila Superior de KPIs estilo DealDeck */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <StatMetricCard
          featured
          title="Valoración Total Stock"
          value={kpis.formattedValuation}
          trendValue={`${kpis.totalUnits} uds`}
          trendDirection="up"
          comparisonLine1="Costo promedio"
          comparisonLine2="ponderado activo"
          icon="layers"
        />
        <StatMetricCard
          title="Bodegas Operativas"
          value={String(kpis.warehousesCount)}
          trendValue="Multi-Sede"
          trendDirection="up"
          comparisonLine1="POS, Trastienda,"
          comparisonLine2="CEDIS y Averías"
          icon="store"
        />
        <StatMetricCard
          title="Alertas Stock Mínimo"
          value={String(kpis.lowStockCount)}
          trendValue={kpis.lowStockCount > 0 ? 'Requiere Pedido' : 'Todo OK'}
          trendDirection={kpis.lowStockCount > 0 ? 'down' : 'up'}
          comparisonLine1="SKUs bajo el"
          comparisonLine2="umbral configurado"
          icon="alert"
        />
        <StatMetricCard
          title="Movimientos Kárdex"
          value={String(kpis.kardexCount)}
          trendValue="Inmutable"
          trendDirection="up"
          comparisonLine1="Trazabilidad ACID"
          comparisonLine2="de entradas/salidas"
          icon="receipt"
        />
      </div>

      {/* Barra de Pestañas + Acción Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <TabSwitcher<InventoryTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'balances',
              label: 'Saldos & Stock Mínimo',
              icon: 'layers',
              count: balances.length,
            },
            {
              id: 'kardex',
              label: 'Kárdex Inmutable',
              icon: 'receipt',
              count: kardex.length,
            },
            {
              id: 'warehouses',
              label: 'Bodegas por Sede',
              icon: 'store',
              count: warehouses.length,
            },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'warehouses' ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateWarehouseModal}
            >
              Nueva Bodega
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={() => openMovementModal()}
            >
              Registrar Movimiento
            </Button>
          )}
        </div>
      </div>

      {/* VISTA 1: SALDOS POR BODEGA Y UMBRALES DE STOCK MÍNIMO */}
      {activeTab === 'balances' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Filtros */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr auto',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <FormField
              placeholder="Buscar saldo por producto, referencia o bodega..."
              value={searchBalance}
              onChange={(e) => setSearchBalance(e.target.value)}
              leftSlot={<Icon name="search" size={17} />}
            />

            <SelectField
              value={filterWarehouseId}
              onChange={(e) => setFilterWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'Todas las bodegas' },
                ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
              ]}
            />

            <Checkbox
              id="low-stock-filter"
              checked={lowStockOnly}
              onChange={setLowStockOnly}
              label="Solo stock bajo mínimo"
            />
          </div>

          {/* Lista de Saldos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {balances.map((bal) => (
              <div
                key={bal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '18px',
                  backgroundColor: bal.isLowStock ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${bal.isLowStock ? '#FECACA' : '#E2E8F0'}`,
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '260px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0F172A' }}>
                      {bal.productName}
                    </span>
                    <Badge tone="brand">{bal.codeReference}</Badge>
                    <Badge tone="neutral">{bal.warehouseName}</Badge>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>
                      Costo Promedio Ponderado: <strong>{bal.formattedAverageCost}</strong>
                    </span>
                    <span>
                      Valoración Total: <strong>{bal.formattedValuation}</strong>
                    </span>
                    <span>
                      En Tránsito: <strong>{bal.qtyInTransit} uds</strong>
                    </span>
                    <span>
                      Stock Mínimo:{' '}
                      <strong>
                        {bal.lowStockAlertEnabled && bal.minStock !== null
                          ? `${bal.minStock} uds`
                          : 'Desactivado'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>
                      Stock Disponible
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.24rem',
                        fontWeight: 800,
                        color: bal.isLowStock ? '#DC2626' : '#0F172A',
                      }}
                    >
                      {bal.qtyAvailable.toLocaleString('es-CO')} uds
                    </span>
                  </div>

                  <TrendPill
                    value={bal.isLowStock ? '¡Bajo Mínimo!' : 'Stock OK'}
                    direction={bal.isLowStock ? 'down' : 'up'}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="settings" size={14} />}
                      onClick={() => openThresholdsModal(bal)}
                    >
                      Stock Mín.
                    </Button>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      leftIcon={<Icon name="plus" size={14} />}
                      onClick={() =>
                        openMovementModal({
                          warehouseId: bal.warehouseId,
                          catalogItemId: bal.catalogItemId,
                          unitCost: bal.averageCost,
                        })
                      }
                    >
                      Movimiento
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 2: KÁRDEX INMUTABLE (/api/v1/inventory/kardex) */}
      {activeTab === 'kardex' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <SelectField
              label="Filtrar por Bodega"
              value={filterWarehouseId}
              onChange={(e) => setFilterWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'Todas las bodegas' },
                ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
              ]}
            />
            <SelectField
              label="Filtrar por Motivo de Movimiento"
              value={filterReasonCode}
              onChange={(e) => setFilterReasonCode(e.target.value)}
              options={[
                { value: '', label: 'Todos los motivos (Entradas y Salidas)' },
                ...reasons.map((r) => ({
                  value: r.code,
                  label: `[${r.movementType}] ${r.name}`,
                })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kardex.map((mov) => {
              const p = mov.props;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '15px 20px',
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                    <TrendPill
                      value={`${mov.isEntry ? 'ENTRADA' : 'SALIDA'} ${mov.formattedQtyDelta}`}
                      direction={mov.isEntry ? 'up' : 'down'}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                          {p.productName}
                        </span>
                        <Badge tone="brand">{p.codeReference}</Badge>
                        <Badge tone="neutral">{p.warehouseName}</Badge>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        {p.reasonName} • {p.referenceCode ? `Doc: ${p.referenceCode} • ` : ''}
                        {p.notes || 'Sin observaciones'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.71rem', color: '#94A3B8' }}>
                        Evolución Saldo
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                        {p.balanceBefore} → {p.balanceAfter} uds
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.71rem', color: '#94A3B8' }}>
                        Costo Unit. / Total
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: '#4D53F4' }}>
                        {mov.formattedUnitCost} ({mov.formattedTotalCost})
                      </strong>
                    </div>

                    <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
                      {mov.formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: BODEGAS POR SEDE (/api/v1/inventory/warehouses) */}
      {activeTab === 'warehouses' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '18px',
          }}
        >
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                padding: '22px',
                boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
                border: wh.isDefaultPos
                  ? '1.5px solid #4D53F4'
                  : '1px solid rgba(226, 232, 240, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A' }}>
                    {wh.name}
                  </span>
                  <Badge tone={wh.isDefaultPos ? 'brand' : 'neutral'}>
                    {wh.warehouseTypeLabel}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4D53F4' }}>
                  Código: {wh.code}
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.45 }}>
                  {wh.description || 'Sin descripción registrada.'}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                {wh.isDefaultPos ? (
                  <Badge tone="success" dot>
                    Bodega POS Principal
                  </Badge>
                ) : (
                  <Badge tone="neutral" dot>
                    Bodega Auxiliar
                  </Badge>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon name="edit" size={14} />}
                    onClick={() => openEditWarehouseModal(wh)}
                  >
                    Editar
                  </Button>
                  {!wh.isDefaultPos && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeleteWarehouse(wh)}
                      style={{ color: '#EF4444' }}
                    >
                      <Icon name="trash" size={15} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: REGISTRAR MOVIMIENTO DE INVENTARIO (POST /api/v1/inventory/movements) */}
      <DialogModal
        isOpen={isMovementModalOpen}
        title="Registrar Movimiento de Inventario"
        subtitle="Genera un asiento inmutable en el Kárdex y recalcula el Costo Promedio Ponderado"
        maxWidth="580px"
        onClose={() => setIsMovementModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveMovement()}>
              Aplicar Movimiento al Kárdex
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SelectField
            label="Bodega Destino / Origen*"
            value={movementDraft.warehouseId}
            onChange={(e) =>
              setMovementDraft((prev) => ({ ...prev, warehouseId: e.target.value }))
            }
            options={warehouses.map((w) => ({
              value: w.id,
              label: `${w.name} (${w.code})`,
            }))}
          />

          <SelectField
            label="Producto del Catálogo*"
            value={movementDraft.catalogItemId}
            onChange={(e) => {
              const itemId = e.target.value;
              const found = distinctCatalogProducts.find((p) => p.id === itemId);
              setMovementDraft((prev) => ({
                ...prev,
                catalogItemId: itemId,
                unitCost: found?.avgCost ?? prev.unitCost,
              }));
            }}
            options={distinctCatalogProducts.map((p) => ({
              value: p.id,
              label: p.label,
            }))}
          />

          <SelectField
            label="Motivo del Movimiento (`/api/v1/inventory/reasons`)*"
            value={movementDraft.reasonCode}
            onChange={(e) =>
              setMovementDraft((prev) => ({ ...prev, reasonCode: e.target.value }))
            }
            options={reasons.map((r) => ({
              value: r.code,
              label: `[${r.movementType === 'IN' ? 'ENTRADA +' : 'SALIDA -'}] ${r.name}`,
            }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              type="number"
              label="Cantidad (Unidades)*"
              value={String(movementDraft.quantity)}
              onChange={(e) =>
                setMovementDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))
              }
            />
            <FormField
              type="number"
              label="Costo Unitario (COP)"
              value={String(movementDraft.unitCost ?? 0)}
              disabled={selectedReasonObj?.movementType === 'OUT'}
              helperText={
                selectedReasonObj?.affectsAverageCost
                  ? 'Recalculará el costo promedio ponderado'
                  : 'Usa el costo promedio vigente'
              }
              onChange={(e) =>
                setMovementDraft((prev) => ({ ...prev, unitCost: Number(e.target.value) }))
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
            <FormField
              label="Documento / Referencia"
              placeholder="Ej: FAC-PROV-9012"
              value={movementDraft.referenceCode ?? ''}
              onChange={(e) =>
                setMovementDraft((prev) => ({ ...prev, referenceCode: e.target.value }))
              }
            />
            <FormField
              label="Notas / Observaciones de Auditoría"
              placeholder="Ej: Ingreso de mercancía verificada"
              value={movementDraft.notes ?? ''}
              onChange={(e) =>
                setMovementDraft((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>
      </DialogModal>

      {/* MODAL 2: CONFIGURAR UMBRALES DE STOCK MÍNIMO (PATCH /api/v1/inventory/balances/thresholds) */}
      <DialogModal
        isOpen={Boolean(editingThresholdBalance)}
        title={`Umbrales de Stock: ${editingThresholdBalance?.productName ?? ''}`}
        subtitle={`Bodega: ${editingThresholdBalance?.warehouseName ?? ''} — Configura alertas o desactívalas para artículos únicos`}
        maxWidth="520px"
        onClose={() => setEditingThresholdBalance(null)}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingThresholdBalance(null)}
            >
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveThresholds()}>
              Guardar Umbrales
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Checkbox
            id="enable-low-stock-alert"
            checked={thresholdDraft.lowStockAlertEnabled}
            onChange={(checked) =>
              setThresholdDraft((prev) => ({
                ...prev,
                lowStockAlertEnabled: checked,
                minStock: checked ? (prev.minStock ?? 5) : null,
              }))
            }
            label="Activar alerta automática de stock mínimo para este producto"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              type="number"
              label="Stock Mínimo (Default 5 uds)"
              disabled={!thresholdDraft.lowStockAlertEnabled}
              value={thresholdDraft.minStock !== null ? String(thresholdDraft.minStock) : ''}
              placeholder="Vacío si no aplica"
              onChange={(e) =>
                setThresholdDraft((prev) => ({
                  ...prev,
                  minStock: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
            <FormField
              type="number"
              label="Stock Máximo Sugerido"
              value={thresholdDraft.maxStock !== null ? String(thresholdDraft.maxStock) : ''}
              onChange={(e) =>
                setThresholdDraft((prev) => ({
                  ...prev,
                  maxStock: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              type="number"
              label="Tiempo Reposición Proveedor (Días)"
              value={String(thresholdDraft.leadTimeDays ?? 3)}
              onChange={(e) =>
                setThresholdDraft((prev) => ({
                  ...prev,
                  leadTimeDays: Number(e.target.value),
                }))
              }
            />
            <FormField
              type="number"
              label="Stock de Seguridad (Uds)"
              value={String(thresholdDraft.safetyStock ?? 2)}
              onChange={(e) =>
                setThresholdDraft((prev) => ({
                  ...prev,
                  safetyStock: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
      </DialogModal>

      {/* MODAL 3: CREAR / EDITAR BODEGA (/api/v1/inventory/warehouses) */}
      <DialogModal
        isOpen={isWarehouseModalOpen}
        title={editingWarehouseId ? 'Editar Bodega POS' : 'Nueva Bodega de Inventario'}
        subtitle="Administra puntos de almacenamiento por sede (Mostrador, Trastienda, CEDIS o Averías)"
        maxWidth="520px"
        onClose={() => setIsWarehouseModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsWarehouseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveWarehouse()}>
              {editingWarehouseId ? 'Guardar Cambios' : 'Crear Bodega'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              label="Código de Bodega*"
              placeholder="Ej: BOD-NORTE-01"
              disabled={Boolean(editingWarehouseId)}
              value={warehouseDraft.code}
              onChange={(e) =>
                setWarehouseDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
            />
            <SelectField
              label="Tipo de Bodega*"
              value={warehouseDraft.warehouseType}
              onChange={(e) =>
                setWarehouseDraft((prev) => ({
                  ...prev,
                  warehouseType: e.target.value as WarehouseType,
                }))
              }
              options={[
                { value: 'POS_STORE', label: 'Mostrador / Tienda POS' },
                { value: 'BACKROOM', label: 'Trastienda / Reserva' },
                { value: 'CENTRAL', label: 'Bodega Central (CEDIS)' },
                { value: 'DAMAGED', label: 'Averías & Mermas' },
              ]}
            />
          </div>

          <FormField
            label="Nombre de la Bodega*"
            placeholder="Ej: Bodega Mostrador Sucursal Norte"
            value={warehouseDraft.name}
            onChange={(e) => setWarehouseDraft((prev) => ({ ...prev, name: e.target.value }))}
          />

          <FormField
            label="Descripción / Ubicación"
            placeholder="Descripción operativa de la bodega"
            value={warehouseDraft.description ?? ''}
            onChange={(e) =>
              setWarehouseDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <Checkbox
            id="default-pos-wh"
            checked={Boolean(warehouseDraft.isDefaultPos)}
            onChange={(checked) =>
              setWarehouseDraft((prev) => ({ ...prev, isDefaultPos: checked }))
            }
            label="Marcar como bodega POS predeterminada para descuento de ventas en caja"
          />
        </div>
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
