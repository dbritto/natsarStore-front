import { Result } from '@shared/domain/Result';

export type MovementDirection = 'IN' | 'OUT';

export interface InventoryReasonDto {
  code: string;
  name: string;
  movementType: MovementDirection;
  affectsAverageCost: boolean;
  isSystem: boolean;
}

export interface KardexMovementProps {
  id: string;
  warehouseId: string;
  warehouseName: string;
  catalogItemId: string;
  codeReference: string;
  productName: string;
  reasonCode: string;
  reasonName: string;
  movementType: MovementDirection;
  qtyDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCost: number;
  totalCost: number;
  referenceCode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RegisterMovementDraft {
  warehouseId: string;
  catalogItemId: string;
  reasonCode: string;
  quantity: number;
  unitCost?: number;
  referenceCode?: string | null;
  notes?: string | null;
}

/**
 * Modelo de Dominio KardexMovementModel (DDD - Diseño en Modelos)
 * Representa un asiento inmutable del Kárdex de inventario (`/api/v1/inventory/kardex`).
 */
export class KardexMovementModel {
  public readonly props: Readonly<KardexMovementProps>;

  constructor(props: KardexMovementProps) {
    this.props = Object.freeze(props);
  }

  public static validateDraft(draft: RegisterMovementDraft): Result<RegisterMovementDraft> {
    if (!draft.warehouseId) {
      return Result.fail('Selecciona la bodega donde se realizará el movimiento.');
    }
    if (!draft.catalogItemId) {
      return Result.fail('Selecciona el producto del catálogo para registrar el movimiento.');
    }
    if (!draft.reasonCode) {
      return Result.fail('Selecciona el motivo del movimiento de inventario.');
    }
    const qty = Number(draft.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return Result.fail('La cantidad del movimiento debe ser mayor a 0.');
    }
    const cost = Number(draft.unitCost ?? 0);
    if (!Number.isFinite(cost) || cost < 0) {
      return Result.fail('El costo unitario debe ser mayor o igual a $0.');
    }

    return Result.ok({
      warehouseId: draft.warehouseId,
      catalogItemId: draft.catalogItemId,
      reasonCode: draft.reasonCode,
      quantity: qty,
      unitCost: cost,
      referenceCode: draft.referenceCode?.trim() || null,
      notes: draft.notes?.trim() || null,
    });
  }

  public get isEntry(): boolean {
    return this.props.movementType === 'IN';
  }

  public get formattedQtyDelta(): string {
    return this.isEntry ? `+${this.props.qtyDelta}` : `${this.props.qtyDelta}`;
  }

  public get formattedUnitCost(): string {
    return `$ ${Math.round(this.props.unitCost).toLocaleString('es-CO')}`;
  }

  public get formattedTotalCost(): string {
    return `$ ${Math.round(this.props.totalCost).toLocaleString('es-CO')}`;
  }

  public get formattedDate(): string {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(this.props.createdAt));
    } catch {
      return this.props.createdAt;
    }
  }
}
