import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export type TransferStatus = 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface TransferLineItemProps {
  catalogItemId: string;
  codeReference: string;
  productName: string;
  qtyDispatched: number;
  qtyReceived: number | null;
  unitCost: number;
}

export interface StockTransferProps {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  status: TransferStatus;
  notes: string | null;
  dispatchedAt: string;
  receivedAt: string | null;
  items: TransferLineItemProps[];
}

export interface DispatchTransferDraft {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  notes?: string | null;
  items: Array<{
    catalogItemId: string;
    quantity: number;
  }>;
}

export interface ReceiveTransferLineDraft {
  catalogItemId: string;
  qtyReceived: number;
}

/**
 * Entidad / Modelo Rico de Dominio StockTransferModel (DDD - Diseño en Modelos)
 * Encapsula las reglas del traslado en 2 pasos:
 * 1) Despacho desde Bodega Origen -> IN_TRANSIT
 * 2) Confirmación total o parcial en Bodega Destino -> RECEIVED (o reversión -> CANCELLED)
 */
export class StockTransferModel extends Entity<StockTransferProps> {
  constructor(props: StockTransferProps) {
    super(props, props.id);
  }

  public static validateDispatch(draft: DispatchTransferDraft): Result<DispatchTransferDraft> {
    if (!draft.sourceWarehouseId || !draft.targetWarehouseId) {
      return Result.fail('Selecciona tanto la bodega de origen como la bodega de destino.');
    }
    if (draft.sourceWarehouseId === draft.targetWarehouseId) {
      return Result.fail('La bodega de origen y la bodega de destino deben ser diferentes.');
    }
    if (!Array.isArray(draft.items) || draft.items.length === 0) {
      return Result.fail('Agrega al menos un producto con cantidad válida para despachar el traslado.');
    }

    for (const line of draft.items) {
      if (!line.catalogItemId) {
        return Result.fail('Todos los renglones del traslado deben tener un producto válido.');
      }
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        return Result.fail('La cantidad a despachar en cada producto debe ser mayor a 0.');
      }
    }

    return Result.ok({
      sourceWarehouseId: draft.sourceWarehouseId,
      targetWarehouseId: draft.targetWarehouseId,
      notes: draft.notes?.trim() || null,
      items: draft.items.map((i) => ({
        catalogItemId: i.catalogItemId,
        quantity: Number(i.quantity),
      })),
    });
  }

  public validateReception(receivedLines: ReceiveTransferLineDraft[]): Result<ReceiveTransferLineDraft[]> {
    if (this.props.status !== 'IN_TRANSIT') {
      return Result.fail('Solo se puede confirmar la recepción de traslados que están en tránsito.');
    }

    const receivedMap = new Map(
      receivedLines.map((l) => [l.catalogItemId, Number(l.qtyReceived)])
    );

    const validated: ReceiveTransferLineDraft[] = [];
    for (const item of this.props.items) {
      const qty = receivedMap.has(item.catalogItemId)
        ? receivedMap.get(item.catalogItemId)!
        : item.qtyDispatched;

      if (!Number.isFinite(qty) || qty < 0 || qty > item.qtyDispatched) {
        return Result.fail(
          `La cantidad recibida de "${item.productName}" debe estar entre 0 y ${item.qtyDispatched} uds.`
        );
      }
      validated.push({ catalogItemId: item.catalogItemId, qtyReceived: qty });
    }

    return Result.ok(validated);
  }

  public get raw(): Readonly<StockTransferProps> {
    return this.props;
  }

  public get transferNumber(): string {
    return this.props.transferNumber;
  }

  public get status(): TransferStatus {
    return this.props.status;
  }

  public get statusLabel(): string {
    const map: Record<TransferStatus, string> = {
      IN_TRANSIT: 'En Tránsito',
      RECEIVED: 'Recibido en Destino',
      CANCELLED: 'Cancelado (Revertido)',
    };
    return map[this.props.status];
  }

  public get isInTransit(): boolean {
    return this.props.status === 'IN_TRANSIT';
  }

  public get totalUnitsDispatched(): number {
    return this.props.items.reduce((acc, i) => acc + i.qtyDispatched, 0);
  }

  public get totalUnitsReceived(): number {
    return this.props.items.reduce((acc, i) => acc + (i.qtyReceived ?? 0), 0);
  }

  public get totalValuationCop(): number {
    return Math.round(
      this.props.items.reduce((acc, i) => acc + i.qtyDispatched * i.unitCost, 0)
    );
  }

  public get formattedValuation(): string {
    return `$ ${this.totalValuationCop.toLocaleString('es-CO')}`;
  }

  public get formattedDispatchedDate(): string {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(this.props.dispatchedAt));
    } catch {
      return this.props.dispatchedAt;
    }
  }
}
