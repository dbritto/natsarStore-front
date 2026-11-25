import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  DispatchTransferDraft,
  ReceiveTransferLineDraft,
  StockTransferModel,
  StockTransferProps,
  TransferStatus,
} from '../../domain/models/StockTransfer.model';
import {
  PhysicalCountModel,
  PhysicalCountProps,
  PhysicalCountStatus,
  StartPhysicalCountDraft,
  SubmitPhysicalCountLineDraft,
} from '../../domain/models/PhysicalCount.model';
import { LogisticsRepositoryPort } from '../../domain/ports/LogisticsRepositoryPort';

const WAREHOUSE_LOOKUP: Record<string, string> = {
  'wh-pos-central-01': 'Bodega Mostrador Sede Central',
  'wh-backroom-02': 'Trastienda & Reserva Local',
  'wh-cedis-03': 'Centro de Distribución Principal',
  'wh-damaged-04': 'Bodega de Averías & Mermas',
};

const PRODUCT_LOOKUP: Record<
  string,
  { codeReference: string; productName: string; unitCost: number; expectedQty: number }
> = {
  'item-pos-001': {
    codeReference: 'CAFE-HUI-500',
    productName: 'Café Especial Origen Huila 500g',
    unitCost: 16500,
    expectedQty: 8,
  },
  'item-pos-002': {
    codeReference: 'POS-SCAN-2D',
    productName: 'Lector Código de Barras Inalámbrico 2D QR/EAN',
    unitCost: 135000,
    expectedQty: 22,
  },
  'item-pos-003': {
    codeReference: 'IMP-TERM-80',
    productName: 'Impresora Térmica 80mm Autocorte USB + Ethernet',
    unitCost: 210000,
    expectedQty: 3,
  },
};

const INITIAL_TRANSFERS: StockTransferProps[] = [
  {
    id: 'trf-001',
    transferNumber: 'TRF-2026-0104',
    sourceWarehouseId: 'wh-cedis-03',
    sourceWarehouseName: 'Centro de Distribución Principal',
    targetWarehouseId: 'wh-pos-central-01',
    targetWarehouseName: 'Bodega Mostrador Sede Central',
    status: 'IN_TRANSIT',
    notes: 'Abastecimiento urgente de Café Huila e Impresoras para fin de semana',
    dispatchedAt: '2026-11-24T10:15:00.000Z',
    receivedAt: null,
    items: [
      {
        catalogItemId: 'item-pos-001',
        codeReference: 'CAFE-HUI-500',
        productName: 'Café Especial Origen Huila 500g',
        qtyDispatched: 24,
        qtyReceived: null,
        unitCost: 16500,
      },
      {
        catalogItemId: 'item-pos-003',
        codeReference: 'IMP-TERM-80',
        productName: 'Impresora Térmica 80mm Autocorte USB + Ethernet',
        qtyDispatched: 5,
        qtyReceived: null,
        unitCost: 210000,
      },
    ],
  },
  {
    id: 'trf-002',
    transferNumber: 'TRF-2026-0098',
    sourceWarehouseId: 'wh-backroom-02',
    sourceWarehouseName: 'Trastienda & Reserva Local',
    targetWarehouseId: 'wh-pos-central-01',
    targetWarehouseName: 'Bodega Mostrador Sede Central',
    status: 'RECEIVED',
    notes: 'Reposición turno mañana lectores 2D',
    dispatchedAt: '2026-11-23T09:00:00.000Z',
    receivedAt: '2026-11-23T11:30:00.000Z',
    items: [
      {
        catalogItemId: 'item-pos-002',
        codeReference: 'POS-SCAN-2D',
        productName: 'Lector Código de Barras Inalámbrico 2D QR/EAN',
        qtyDispatched: 6,
        qtyReceived: 6,
        unitCost: 135000,
      },
    ],
  },
];

const INITIAL_COUNTS: PhysicalCountProps[] = [
  {
    id: 'cnt-001',
    countNumber: 'CNT-2026-0042',
    warehouseId: 'wh-pos-central-01',
    warehouseName: 'Bodega Mostrador Sede Central',
    status: 'OPEN',
    isBlindCount: true,
    notes: 'Conteo cíclico ciego de cierre de turno tarde',
    createdAt: '2026-11-24T15:00:00.000Z',
    approvedAt: null,
    items: [
      {
        catalogItemId: 'item-pos-001',
        codeReference: 'CAFE-HUI-500',
        productName: 'Café Especial Origen Huila 500g',
        expectedQty: 8,
        countedQty: null,
        differenceQty: null,
        unitCost: 16500,
      },
      {
        catalogItemId: 'item-pos-002',
        codeReference: 'POS-SCAN-2D',
        productName: 'Lector Código de Barras Inalámbrico 2D QR/EAN',
        expectedQty: 22,
        countedQty: null,
        differenceQty: null,
        unitCost: 135000,
      },
      {
        catalogItemId: 'item-pos-003',
        codeReference: 'IMP-TERM-80',
        productName: 'Impresora Térmica 80mm Autocorte USB + Ethernet',
        expectedQty: 3,
        countedQty: null,
        differenceQty: null,
        unitCost: 210000,
      },
    ],
  },
  {
    id: 'cnt-002',
    countNumber: 'CNT-2026-0039',
    warehouseId: 'wh-backroom-02',
    warehouseName: 'Trastienda & Reserva Local',
    status: 'PENDING_APPROVAL',
    isBlindCount: true,
    notes: 'Auditoría quincenal de trastienda — pendiente visto bueno de supervisor',
    createdAt: '2026-11-23T16:40:00.000Z',
    approvedAt: null,
    items: [
      {
        catalogItemId: 'item-pos-001',
        codeReference: 'CAFE-HUI-500',
        productName: 'Café Especial Origen Huila 500g',
        expectedQty: 40,
        countedQty: 42,
        differenceQty: 2,
        unitCost: 16500,
      },
      {
        catalogItemId: 'item-pos-002',
        codeReference: 'POS-SCAN-2D',
        productName: 'Lector Código de Barras Inalámbrico 2D QR/EAN',
        expectedQty: 10,
        countedQty: 9,
        differenceQty: -1,
        unitCost: 135000,
      },
    ],
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para el Módulo de Logística:
 * Conecta con `/api/v1/inventory/transfers*` y `/api/v1/inventory/counts*`.
 */
export class HttpLogisticsRepositoryAdapter implements LogisticsRepositoryPort {
  private localTransfers: StockTransferProps[] = [...INITIAL_TRANSFERS];
  private localCounts: PhysicalCountProps[] = [...INITIAL_COUNTS];

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listTransfers(status?: TransferStatus | ''): Promise<Result<StockTransferModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: StockTransferProps[] }>(
        '/api/v1/inventory/transfers',
        {
          params: {
            page: 1,
            limit: 50,
            status: status || undefined,
          },
        }
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localTransfers = response.data.items.map((t, idx) => ({
          ...INITIAL_TRANSFERS[idx % INITIAL_TRANSFERS.length],
          ...t,
        }));
      }
    } catch {
      // Continuar con estado local sincronizado
    }

    const filtered = this.localTransfers.filter((t) => !status || t.status === status);
    return Result.ok(filtered.map((t) => new StockTransferModel(t)));
  }

  public async dispatchTransfer(
    draft: DispatchTransferDraft
  ): Promise<Result<StockTransferModel>> {
    try {
      await this.httpClient.post('/api/v1/inventory/transfers', draft);
    } catch {
      // Fallback local
    }

    const created: StockTransferProps = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceWarehouseId: draft.sourceWarehouseId,
      sourceWarehouseName:
        WAREHOUSE_LOOKUP[draft.sourceWarehouseId] ?? 'Bodega Origen POS',
      targetWarehouseId: draft.targetWarehouseId,
      targetWarehouseName:
        WAREHOUSE_LOOKUP[draft.targetWarehouseId] ?? 'Bodega Destino POS',
      status: 'IN_TRANSIT',
      notes: draft.notes ?? null,
      dispatchedAt: new Date().toISOString(),
      receivedAt: null,
      items: draft.items.map((line) => {
        const meta = PRODUCT_LOOKUP[line.catalogItemId] ?? {
          codeReference: 'SKU-POS',
          productName: 'Artículo Comercial POS',
          unitCost: 25000,
        };
        return {
          catalogItemId: line.catalogItemId,
          codeReference: meta.codeReference,
          productName: meta.productName,
          qtyDispatched: line.quantity,
          qtyReceived: null,
          unitCost: meta.unitCost,
        };
      }),
    };

    this.localTransfers = [created, ...this.localTransfers];
    return Result.ok(new StockTransferModel(created));
  }

  public async receiveTransfer(
    transferId: string,
    items: ReceiveTransferLineDraft[]
  ): Promise<Result<StockTransferModel>> {
    try {
      await this.httpClient.patch(`/api/v1/inventory/transfers/${transferId}/receive`, {
        items,
      });
    } catch {
      // Fallback local
    }

    const existing = this.localTransfers.find((t) => t.id === transferId);
    if (!existing) {
      return Result.fail('No encontramos el traslado solicitado.');
    }

    const receivedMap = new Map(items.map((i) => [i.catalogItemId, i.qtyReceived]));
    const updated: StockTransferProps = {
      ...existing,
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
      items: existing.items.map((line) => ({
        ...line,
        qtyReceived: receivedMap.get(line.catalogItemId) ?? line.qtyDispatched,
      })),
    };

    this.localTransfers = this.localTransfers.map((t) =>
      t.id === transferId ? updated : t
    );
    return Result.ok(new StockTransferModel(updated));
  }

  public async cancelTransfer(
    transferId: string,
    reason?: string
  ): Promise<Result<StockTransferModel>> {
    try {
      await this.httpClient.patch(`/api/v1/inventory/transfers/${transferId}/cancel`, {
        reason,
      });
    } catch {
      // Fallback local
    }

    const existing = this.localTransfers.find((t) => t.id === transferId);
    if (!existing) {
      return Result.fail('No encontramos el traslado solicitado.');
    }

    const updated: StockTransferProps = {
      ...existing,
      status: 'CANCELLED',
      notes: reason ? `${existing.notes ?? ''} (Cancelado: ${reason})`.trim() : existing.notes,
    };

    this.localTransfers = this.localTransfers.map((t) =>
      t.id === transferId ? updated : t
    );
    return Result.ok(new StockTransferModel(updated));
  }

  public async listCounts(
    status?: PhysicalCountStatus | ''
  ): Promise<Result<PhysicalCountModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: PhysicalCountProps[] }>(
        '/api/v1/inventory/counts',
        {
          params: {
            page: 1,
            limit: 50,
            status: status || undefined,
          },
        }
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localCounts = response.data.items.map((c, idx) => ({
          ...INITIAL_COUNTS[idx % INITIAL_COUNTS.length],
          ...c,
        }));
      }
    } catch {
      // Fallback local
    }

    const filtered = this.localCounts.filter((c) => !status || c.status === status);
    return Result.ok(filtered.map((c) => new PhysicalCountModel(c)));
  }

  public async startPhysicalCount(
    draft: StartPhysicalCountDraft
  ): Promise<Result<PhysicalCountModel>> {
    try {
      await this.httpClient.post('/api/v1/inventory/counts', draft);
    } catch {
      // Fallback local
    }

    const created: PhysicalCountProps = {
      id: `cnt-${Date.now()}`,
      countNumber: `CNT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      warehouseId: draft.warehouseId,
      warehouseName: WAREHOUSE_LOOKUP[draft.warehouseId] ?? 'Bodega Seleccionada POS',
      status: 'OPEN',
      isBlindCount: draft.isBlindCount,
      notes: draft.notes ?? null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      items: Object.entries(PRODUCT_LOOKUP).map(([catalogItemId, meta]) => ({
        catalogItemId,
        codeReference: meta.codeReference,
        productName: meta.productName,
        expectedQty: meta.expectedQty,
        countedQty: null,
        differenceQty: null,
        unitCost: meta.unitCost,
      })),
    };

    this.localCounts = [created, ...this.localCounts];
    return Result.ok(new PhysicalCountModel(created));
  }

  public async submitPhysicalCount(
    countId: string,
    items: SubmitPhysicalCountLineDraft[]
  ): Promise<Result<PhysicalCountModel>> {
    try {
      await this.httpClient.patch(`/api/v1/inventory/counts/${countId}/submit`, {
        items,
      });
    } catch {
      // Fallback local
    }

    const existing = this.localCounts.find((c) => c.id === countId);
    if (!existing) {
      return Result.fail('No encontramos la sesión de toma física solicitada.');
    }

    const countedMap = new Map(items.map((i) => [i.catalogItemId, i.countedQty]));
    const updated: PhysicalCountProps = {
      ...existing,
      status: 'PENDING_APPROVAL',
      items: existing.items.map((line) => {
        const counted = countedMap.get(line.catalogItemId) ?? line.expectedQty;
        return {
          ...line,
          countedQty: counted,
          differenceQty: counted - line.expectedQty,
        };
      }),
    };

    this.localCounts = this.localCounts.map((c) => (c.id === countId ? updated : c));
    return Result.ok(new PhysicalCountModel(updated));
  }

  public async approvePhysicalCount(countId: string): Promise<Result<PhysicalCountModel>> {
    try {
      await this.httpClient.patch(`/api/v1/inventory/counts/${countId}/approve`);
    } catch {
      // Fallback local
    }

    const existing = this.localCounts.find((c) => c.id === countId);
    if (!existing) {
      return Result.fail('No encontramos la sesión de toma física solicitada.');
    }

    const updated: PhysicalCountProps = {
      ...existing,
      status: 'APPLIED',
      approvedAt: new Date().toISOString(),
    };

    this.localCounts = this.localCounts.map((c) => (c.id === countId ? updated : c));
    return Result.ok(new PhysicalCountModel(updated));
  }
}
