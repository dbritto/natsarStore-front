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
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  DispatchTransferDraft,
  ReceiveTransferLineDraft,
  StockTransferModel,
  TransferStatus,
} from '../../domain/models/StockTransfer.model';
import {
  PhysicalCountModel,
  PhysicalCountStatus,
  StartPhysicalCountDraft,
  SubmitPhysicalCountLineDraft,
} from '../../domain/models/PhysicalCount.model';
import { LogisticsUseCases } from '../../application/use-cases/LogisticsUseCases';

export interface LogisticsModuleViewProps {
  logisticsUseCases: LogisticsUseCases;
}

type LogisticsTabId = 'transfers' | 'counts';

const WAREHOUSE_OPTIONS = [
  { value: 'wh-pos-central-01', label: 'Bodega Mostrador Sede Central (BOD-POS-CENTRAL)' },
  { value: 'wh-backroom-02', label: 'Trastienda & Reserva Local (BOD-TRASTIENDA-01)' },
  { value: 'wh-cedis-03', label: 'Centro de Distribución Principal (CEDIS-NORTE)' },
  { value: 'wh-damaged-04', label: 'Bodega de Averías & Mermas (BOD-AVERIAS)' },
];

const CATALOG_PRODUCT_OPTIONS = [
  { value: 'item-pos-001', label: 'CAFE-HUI-500 — Café Especial Origen Huila 500g' },
  { value: 'item-pos-002', label: 'POS-SCAN-2D — Lector Código de Barras Inalámbrico 2D' },
  { value: 'item-pos-003', label: 'IMP-TERM-80 — Impresora Térmica 80mm Autocorte' },
];

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo de Logística)
 * Implementa Traslados entre Bodegas en 2 Pasos y Tomas Físicas Ciegas usando 100% `@shared/components`.
 */
export const LogisticsModuleView: React.FC<LogisticsModuleViewProps> = ({
  logisticsUseCases,
}) => {
  const [activeTab, setActiveTab] = useState<LogisticsTabId>('transfers');
  const [transfers, setTransfers] = useState<StockTransferModel[]>([]);
  const [counts, setCounts] = useState<PhysicalCountModel[]>([]);

  const [filterTransferStatus, setFilterTransferStatus] = useState<TransferStatus | ''>('');
  const [filterCountStatus, setFilterCountStatus] = useState<PhysicalCountStatus | ''>('');

  // Modal amigable compartido
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Modal 1: Despachar Nuevo Traslado (POST /api/v1/inventory/transfers)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchDraft, setDispatchDraft] = useState<DispatchTransferDraft>({
    sourceWarehouseId: 'wh-cedis-03',
    targetWarehouseId: 'wh-pos-central-01',
    notes: '',
    items: [{ catalogItemId: 'item-pos-001', quantity: 12 }],
  });
  const [newLineProductId, setNewLineProductId] = useState('item-pos-002');
  const [newLineQty, setNewLineQty] = useState('5');

  // Modal 2: Confirmar Recepción Total o Parcial (PATCH /api/v1/inventory/transfers/:id/receive)
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransferModel | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

  // Modal 3: Iniciar Toma Física Ciega (POST /api/v1/inventory/counts)
  const [isStartCountModalOpen, setIsStartCountModalOpen] = useState(false);
  const [startCountDraft, setStartCountDraft] = useState<StartPhysicalCountDraft>({
    warehouseId: 'wh-pos-central-01',
    isBlindCount: true,
    notes: '',
  });

  // Modal 4: Registrar Cantidades Contadas por Operario (PATCH /api/v1/inventory/counts/:id/submit)
  const [submittingCount, setSubmittingCount] = useState<PhysicalCountModel | null>(null);
  const [countedQuantities, setCountedQuantities] = useState<Record<string, string>>({});

  const loadLogisticsData = async () => {
    const [trfRes, cntRes] = await Promise.all([
      logisticsUseCases.getTransfers(filterTransferStatus),
      logisticsUseCases.getPhysicalCounts(filterCountStatus),
    ]);
    if (trfRes.isSuccess) setTransfers(trfRes.getValue());
    if (cntRes.isSuccess) setCounts(cntRes.getValue());
  };

  useEffect(() => {
    void loadLogisticsData();
  }, [filterTransferStatus, filterCountStatus]);

  const kpis = useMemo(() => {
    const inTransitList = transfers.filter((t) => t.status === 'IN_TRANSIT');
    const inTransitValue = inTransitList.reduce((acc, t) => acc + t.totalValuationCop, 0);
    const receivedCount = transfers.filter((t) => t.status === 'RECEIVED').length;
    const openOrPendingCounts = counts.filter((c) => c.status !== 'APPLIED').length;
    const pendingApprovalCounts = counts.filter((c) => c.status === 'PENDING_APPROVAL').length;

    return {
      inTransitCount: inTransitList.length,
      formattedInTransitValue: `$ ${inTransitValue.toLocaleString('es-CO')}`,
      receivedCount,
      openOrPendingCounts,
      pendingApprovalCounts,
    };
  }, [transfers, counts]);

  // --- Operaciones de Traslados en 2 Pasos ---
  const openDispatchModal = () => {
    setDispatchDraft({
      sourceWarehouseId: 'wh-cedis-03',
      targetWarehouseId: 'wh-pos-central-01',
      notes: '',
      items: [{ catalogItemId: 'item-pos-001', quantity: 12 }],
    });
    setIsDispatchModalOpen(true);
  };

  const handleAddLineToTransfer = () => {
    const qty = Number(newLineQty);
    if (!Number.isFinite(qty) || qty <= 0) return;

    setDispatchDraft((prev) => {
      const exists = prev.items.some((i) => i.catalogItemId === newLineProductId);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.catalogItemId === newLineProductId
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { catalogItemId: newLineProductId, quantity: qty }],
      };
    });
  };

  const handleRemoveLineFromTransfer = (catalogItemId: string) => {
    setDispatchDraft((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.catalogItemId !== catalogItemId),
    }));
  };

  const handleDispatchSubmit = async () => {
    const res = await logisticsUseCases.dispatchTransfer(dispatchDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa los datos del traslado'
        )
      );
      return;
    }

    setIsDispatchModalOpen(false);
    await loadLogisticsData();
    const trf = res.getValue();
    setFriendlyNotice({
      title: 'Traslado despachado en tránsito',
      message: `El traslado "${trf.transferNumber}" salió de la bodega origen y quedó en estado EN TRÁNSITO hacia "${trf.raw.targetWarehouseName}".`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const openReceiveModal = (transfer: StockTransferModel) => {
    const initialMap: Record<string, number> = {};
    transfer.raw.items.forEach((item) => {
      initialMap[item.catalogItemId] = item.qtyDispatched;
    });
    setReceiveQuantities(initialMap);
    setReceivingTransfer(transfer);
  };

  const handleConfirmReception = async () => {
    if (!receivingTransfer) return;
    const lines: ReceiveTransferLineDraft[] = receivingTransfer.raw.items.map((item) => ({
      catalogItemId: item.catalogItemId,
      qtyReceived: Number(receiveQuantities[item.catalogItemId] ?? item.qtyDispatched),
    }));

    const res = await logisticsUseCases.confirmTransferReception(receivingTransfer, lines);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Verifica las cantidades recibidas'
        )
      );
      return;
    }

    setReceivingTransfer(null);
    await loadLogisticsData();
    setFriendlyNotice({
      title: 'Mercancía recibida en bodega destino',
      message: `Se confirmó la llegada del traslado "${res.getValue().transferNumber}" y se sumó al stock disponible en destino.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const handleCancelTransfer = async (transfer: StockTransferModel) => {
    const res = await logisticsUseCases.cancelTransferInTransit(
      transfer,
      'Reversión solicitada desde panel logístico'
    );
    if (res.isFailure) {
      setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
      return;
    }

    await loadLogisticsData();
    setFriendlyNotice({
      title: 'Traslado cancelado y stock revertido',
      message: `Las unidades del traslado "${transfer.transferNumber}" regresaron automáticamente al saldo disponible de la bodega origen.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  // --- Operaciones de Tomas Físicas Ciegas ---
  const handleStartCountSubmit = async () => {
    const res = await logisticsUseCases.startBlindCount(startCountDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'No fue posible abrir el conteo')
      );
      return;
    }

    setIsStartCountModalOpen(false);
    await loadLogisticsData();
    const cnt = res.getValue();
    setFriendlyNotice({
      title: 'Sesión de toma física abierta',
      message: `Se creó el conteo "${cnt.countNumber}" en "${cnt.raw.warehouseName}". El operario ya puede registrar las cantidades físicas contadas.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const openSubmitCountModal = (count: PhysicalCountModel) => {
    const initial: Record<string, string> = {};
    count.raw.items.forEach((item) => {
      initial[item.catalogItemId] =
        item.countedQty !== null ? String(item.countedQty) : '';
    });
    setCountedQuantities(initial);
    setSubmittingCount(count);
  };

  const handleSubmitCountQuantities = async () => {
    if (!submittingCount) return;
    const lines: SubmitPhysicalCountLineDraft[] = submittingCount.raw.items.map((item) => ({
      catalogItemId: item.catalogItemId,
      countedQty:
        countedQuantities[item.catalogItemId] === ''
          ? NaN
          : Number(countedQuantities[item.catalogItemId]),
    }));

    const res = await logisticsUseCases.submitCountedQuantities(submittingCount, lines);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Completa todas las cantidades físicas'
        )
      );
      return;
    }

    setSubmittingCount(null);
    await loadLogisticsData();
    setFriendlyNotice({
      title: 'Conteo físico enviado a revisión',
      message: `Las cantidades fueron registradas y el conteo pasó a estado PENDIENTE DE APROBACIÓN para revisión del supervisor.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleApproveCount = async (count: PhysicalCountModel) => {
    const res = await logisticsUseCases.approvePhysicalCount(count);
    if (res.isFailure) {
      setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
      return;
    }

    await loadLogisticsData();
    setFriendlyNotice({
      title: 'Toma física aprobada y aplicada al Kárdex',
      message: `El supervisor aprobó el conteo "${count.countNumber}" y los ajustes por diferencias fueron asentados automáticamente en el Kárdex.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

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
          title="Mercancía en Tránsito"
          value={kpis.formattedInTransitValue}
          trendValue={`${kpis.inTransitCount} Envíos`}
          trendDirection="up"
          comparisonLine1="Despachados pendientes"
          comparisonLine2="de recepción destino"
          icon="truck"
        />
        <StatMetricCard
          title="Traslados Completados"
          value={String(kpis.receivedCount)}
          trendValue="2 Pasos OK"
          trendDirection="up"
          comparisonLine1="Recibidos y sumados"
          comparisonLine2="al Kárdex destino"
          icon="check"
        />
        <StatMetricCard
          title="Tomas Físicas Activas"
          value={String(kpis.openOrPendingCounts)}
          trendValue="Conteo Ciego"
          trendDirection="up"
          comparisonLine1="Sesiones abiertas o"
          comparisonLine2="en revisión supervisor"
          icon="layers"
        />
        <StatMetricCard
          title="Por Aprobar Supervisor"
          value={String(kpis.pendingApprovalCounts)}
          trendValue={kpis.pendingApprovalCounts > 0 ? 'Requiere Firma' : 'Al Día'}
          trendDirection={kpis.pendingApprovalCounts > 0 ? 'down' : 'up'}
          comparisonLine1="Segregación de"
          comparisonLine2="funciones activa"
          icon="shield"
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
        <TabSwitcher<LogisticsTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'transfers',
              label: 'Traslados entre Bodegas (2 Pasos)',
              icon: 'truck',
              count: transfers.length,
            },
            {
              id: 'counts',
              label: 'Tomas Físicas & Conteo Ciego',
              icon: 'layers',
              count: counts.length,
            },
          ]}
        />

        <div>
          {activeTab === 'transfers' ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openDispatchModal}
            >
              Despachar Traslado
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={() => setIsStartCountModalOpen(true)}
            >
              Iniciar Toma Física Ciega
            </Button>
          )}
        </div>
      </div>

      {/* VISTA 1: TRASLADOS ENTRE BODEGAS EN 2 PASOS (/api/v1/inventory/transfers) */}
      {activeTab === 'transfers' && (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: '', label: 'Todos los Traslados' },
                  { id: 'IN_TRANSIT', label: 'En Tránsito (IN_TRANSIT)' },
                  { id: 'RECEIVED', label: 'Recibidos (RECEIVED)' },
                  { id: 'CANCELLED', label: 'Cancelados (CANCELLED)' },
                ] as const
              ).map((st) => (
                <Button
                  key={st.label}
                  type="button"
                  size="sm"
                  variant={filterTransferStatus === st.id ? 'primary' : 'outline'}
                  onClick={() => setFilterTransferStatus(st.id)}
                >
                  {st.label}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transfers.map((trf) => {
              const raw = trf.raw;
              return (
                <div
                  key={trf.id}
                  style={{
                    borderRadius: '20px',
                    padding: '20px 22px',
                    backgroundColor: trf.isInTransit ? '#F8FAFF' : '#F8FAFC',
                    border: trf.isInTransit
                      ? '1.5px solid #4D53F4'
                      : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Cabecera del Traslado */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                          {trf.transferNumber}
                        </span>
                        <Badge
                          tone={
                            trf.status === 'IN_TRANSIT'
                              ? 'warning'
                              : trf.status === 'RECEIVED'
                              ? 'success'
                              : 'danger'
                          }
                          dot
                        >
                          {trf.statusLabel}
                        </Badge>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          Despachado: {trf.formattedDispatchedDate}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                        <span>{raw.sourceWarehouseName}</span>
                        <Icon name="arrow-right" size={16} style={{ color: '#4D53F4' }} />
                        <span style={{ color: '#4D53F4' }}>{raw.targetWarehouseName}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>
                          Valoración en Traslado
                        </span>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#0F172A' }}>
                          {trf.formattedValuation}
                        </strong>
                      </div>

                      {trf.isInTransit && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Icon name="check" size={14} />}
                            onClick={() => openReceiveModal(trf)}
                          >
                            Confirmar Recepción
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleCancelTransfer(trf)}
                            style={{ color: '#EF4444' }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {raw.notes && (
                    <p style={{ fontSize: '0.79rem', color: '#64748B' }}>
                      Nota: {raw.notes}
                    </p>
                  )}

                  {/* Renglones de productos del traslado */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {raw.items.map((line) => (
                      <div
                        key={line.catalogItemId}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                            {line.productName}
                          </div>
                          <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                            SKU: {line.codeReference}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                          <div>
                            Enviado: <strong>{line.qtyDispatched} uds</strong>
                          </div>
                          {line.qtyReceived !== null && (
                            <div style={{ color: '#047857', fontWeight: 700 }}>
                              Recibido: {line.qtyReceived} uds
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: TOMAS FÍSICAS Y CONTEO CIEGO (/api/v1/inventory/counts) */}
      {activeTab === 'counts' && (
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: '', label: 'Todas las Tomas Físicas' },
                { id: 'OPEN', label: 'En Captura Ciega (OPEN)' },
                { id: 'PENDING_APPROVAL', label: 'Pendiente Supervisor (PENDING_APPROVAL)' },
                { id: 'APPLIED', label: 'Aplicadas al Kárdex (APPLIED)' },
              ] as const
            ).map((st) => (
              <Button
                key={st.label}
                type="button"
                size="sm"
                variant={filterCountStatus === st.id ? 'primary' : 'outline'}
                onClick={() => setFilterCountStatus(st.id)}
              >
                {st.label}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {counts.map((cnt) => {
              const raw = cnt.raw;
              return (
                <div
                  key={cnt.id}
                  style={{
                    borderRadius: '20px',
                    padding: '20px 22px',
                    backgroundColor:
                      cnt.status === 'PENDING_APPROVAL' ? '#FFFBEB' : '#F8FAFC',
                    border:
                      cnt.status === 'PENDING_APPROVAL'
                        ? '1.5px solid #F59E0B'
                        : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                          {cnt.countNumber}
                        </span>
                        <Badge
                          tone={
                            cnt.status === 'OPEN'
                              ? 'brand'
                              : cnt.status === 'PENDING_APPROVAL'
                              ? 'warning'
                              : 'success'
                          }
                          dot
                        >
                          {cnt.statusLabel}
                        </Badge>
                        {raw.isBlindCount && (
                          <Badge tone="neutral">Conteo Ciego</Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '0.83rem', color: '#475569', marginTop: '4px' }}>
                        Bodega: <strong>{raw.warehouseName}</strong> • Apertura: {cnt.formattedCreatedDate}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {cnt.status !== 'OPEN' && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                            Variación Neta Conteo
                          </span>
                          <strong
                            style={{
                              fontSize: '1rem',
                              color:
                                cnt.totalNetVarianceCop < 0
                                  ? '#DC2626'
                                  : cnt.totalNetVarianceCop > 0
                                  ? '#047857'
                                  : '#0F172A',
                            }}
                          >
                            {cnt.formattedNetVarianceCop}
                          </strong>
                        </div>
                      )}

                      {cnt.status === 'OPEN' && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          leftIcon={<Icon name="edit" size={14} />}
                          onClick={() => openSubmitCountModal(cnt)}
                        >
                          Registrar Conteo Físico
                        </Button>
                      )}

                      {cnt.status === 'PENDING_APPROVAL' && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          leftIcon={<Icon name="shield" size={14} />}
                          onClick={() => void handleApproveCount(cnt)}
                        >
                          Aprobar y Ajustar Kárdex
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tabla de renglones del conteo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {raw.items.map((item) => (
                      <div
                        key={item.catalogItemId}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                            {item.productName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>
                            ({item.codeReference})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem' }}>
                          <span>
                            Esperado Sistema:{' '}
                            <strong>
                              {cnt.hideExpectedStock ? '🔒 Oculto (Ciego)' : `${item.expectedQty} uds`}
                            </strong>
                          </span>
                          <span>
                            Contado Físico:{' '}
                            <strong>
                              {item.countedQty !== null ? `${item.countedQty} uds` : 'Pendiente'}
                            </strong>
                          </span>
                          {item.differenceQty !== null && (
                            <TrendPill
                              value={`Dif: ${item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty} uds`}
                              direction={
                                item.differenceQty === 0
                                  ? 'neutral'
                                  : item.differenceQty > 0
                                  ? 'up'
                                  : 'down'
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: DESPACHAR NUEVO TRASLADO ENTRE BODEGAS (POST /api/v1/inventory/transfers) */}
      <DialogModal
        isOpen={isDispatchModalOpen}
        title="Despachar Traslado entre Bodegas (Paso 1)"
        subtitle="Descuenta del disponible en Bodega Origen y coloca la mercancía EN TRÁNSITO hacia Bodega Destino"
        maxWidth="620px"
        onClose={() => setIsDispatchModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsDispatchModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleDispatchSubmit()}>
              Despachar Mercancía (IN_TRANSIT)
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Bodega Origen (Sale Stock)*"
              value={dispatchDraft.sourceWarehouseId}
              onChange={(e) =>
                setDispatchDraft((prev) => ({ ...prev, sourceWarehouseId: e.target.value }))
              }
              options={WAREHOUSE_OPTIONS}
            />
            <SelectField
              label="Bodega Destino (En Tránsito)*"
              value={dispatchDraft.targetWarehouseId}
              onChange={(e) =>
                setDispatchDraft((prev) => ({ ...prev, targetWarehouseId: e.target.value }))
              }
              options={WAREHOUSE_OPTIONS}
            />
          </div>

          <FormField
            label="Notas / Guía de Remisión"
            placeholder="Ej: Envío con transportador interno placa NTR-402"
            value={dispatchDraft.notes ?? ''}
            onChange={(e) =>
              setDispatchDraft((prev) => ({ ...prev, notes: e.target.value }))
            }
          />

          <Divider label="Productos a Trasladar" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <SelectField
              label="Producto"
              value={newLineProductId}
              onChange={(e) => setNewLineProductId(e.target.value)}
              options={CATALOG_PRODUCT_OPTIONS}
            />
            <FormField
              type="number"
              label="Cantidad (Uds)"
              value={newLineQty}
              onChange={(e) => setNewLineQty(e.target.value)}
            />
            <Button type="button" variant="subtle" onClick={handleAddLineToTransfer}>
              + Agregar
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dispatchDraft.items.map((line) => {
              const label =
                CATALOG_PRODUCT_OPTIONS.find((p) => p.value === line.catalogItemId)?.label ??
                line.catalogItemId;
              return (
                <div
                  key={line.catalogItemId}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge tone="brand">{line.quantity} uds</Badge>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineFromTransfer(line.catalogItemId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogModal>

      {/* MODAL 2: CONFIRMAR RECEPCIÓN EN BODEGA DESTINO (PATCH /api/v1/inventory/transfers/:id/receive) */}
      <DialogModal
        isOpen={Boolean(receivingTransfer)}
        title={`Confirmar Recepción: ${receivingTransfer?.transferNumber ?? ''}`}
        subtitle={`Bodega Destino: ${receivingTransfer?.raw.targetWarehouseName ?? ''} — Puedes confirmar llegada total o parcial`}
        maxWidth="560px"
        onClose={() => setReceivingTransfer(null)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setReceivingTransfer(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleConfirmReception()}>
              Confirmar Llegada (RECEIVED)
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {receivingTransfer?.raw.items.map((item) => (
            <div
              key={item.catalogItemId}
              style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                  {item.productName}
                </div>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Despachado desde origen: <strong>{item.qtyDispatched} uds</strong>
                </span>
              </div>

              <div style={{ width: '140px' }}>
                <FormField
                  type="number"
                  label="Cant. Recibida"
                  value={String(receiveQuantities[item.catalogItemId] ?? item.qtyDispatched)}
                  onChange={(e) =>
                    setReceiveQuantities((prev) => ({
                      ...prev,
                      [item.catalogItemId]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </DialogModal>

      {/* MODAL 3: INICIAR TOMA FÍSICA CIEGA (POST /api/v1/inventory/counts) */}
      <DialogModal
        isOpen={isStartCountModalOpen}
        title="Iniciar Sesión de Toma Física"
        subtitle="Toma una instantánea de los saldos de la bodega para auditoría física"
        maxWidth="500px"
        onClose={() => setIsStartCountModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsStartCountModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleStartCountSubmit()}>
              Abrir Conteo Físico
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SelectField
            label="Bodega a Auditar*"
            value={startCountDraft.warehouseId}
            onChange={(e) =>
              setStartCountDraft((prev) => ({ ...prev, warehouseId: e.target.value }))
            }
            options={WAREHOUSE_OPTIONS}
          />

          <Checkbox
            id="blind-count-check"
            checked={startCountDraft.isBlindCount}
            onChange={(checked) =>
              setStartCountDraft((prev) => ({ ...prev, isBlindCount: checked }))
            }
            label="Activar Conteo Ciego (oculta el saldo esperado del sistema al operario)"
          />

          <FormField
            label="Observaciones de Apertura"
            placeholder="Ej: Conteo cíclico mensual de cierre"
            value={startCountDraft.notes ?? ''}
            onChange={(e) =>
              setStartCountDraft((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
      </DialogModal>

      {/* MODAL 4: CAPTURAR CANTIDADES FÍSICAS CONTADAS (PATCH /api/v1/inventory/counts/:id/submit) */}
      <DialogModal
        isOpen={Boolean(submittingCount)}
        title={`Captura de Conteo Físico: ${submittingCount?.countNumber ?? ''}`}
        subtitle={`Bodega: ${submittingCount?.raw.warehouseName ?? ''} — Ingresa las unidades físicas encontradas en estantería`}
        maxWidth="560px"
        onClose={() => setSubmittingCount(null)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSubmittingCount(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSubmitCountQuantities()}
            >
              Enviar a Revisión Supervisor
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {submittingCount?.raw.items.map((item) => (
            <div
              key={item.catalogItemId}
              style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                  {item.productName}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  SKU: {item.codeReference} • Esperado:{' '}
                  <strong>
                    {submittingCount.hideExpectedStock
                      ? '🔒 Oculto en Conteo Ciego'
                      : `${item.expectedQty} uds`}
                  </strong>
                </span>
              </div>

              <div style={{ width: '140px' }}>
                <FormField
                  type="number"
                  label="Conteo Físico*"
                  placeholder="0"
                  value={countedQuantities[item.catalogItemId] ?? ''}
                  onChange={(e) =>
                    setCountedQuantities((prev) => ({
                      ...prev,
                      [item.catalogItemId]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ))}
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
