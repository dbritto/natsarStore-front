import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface StockBalanceProps {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  catalogItemId: string;
  codeReference: string;
  productName: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyInTransit: number;
  qtyAvailable: number;
  averageCost: number;
  lastCost: number;
  minStock: number | null;
  maxStock: number | null;
  lowStockAlertEnabled: boolean;
  leadTimeDays: number | null;
  safetyStock: number | null;
  lastMovementAt: string | null;
}

export interface UpdateThresholdsDraft {
  warehouseId: string;
  catalogItemId: string;
  minStock: number | null;
  maxStock: number | null;
  lowStockAlertEnabled: boolean;
  leadTimeDays?: number | null;
  safetyStock?: number | null;
}

/**
 * Entidad / Modelo Rico de Dominio StockBalanceModel (DDD - Diseño en Modelos)
 * Encapsula el cálculo de valoración por Costo Promedio Ponderado, alertas de stock mínimo
 * y políticas de umbral flexible (default 5 o desactivado para productos únicos costosos).
 */
export class StockBalanceModel extends Entity<StockBalanceProps> {
  constructor(props: StockBalanceProps) {
    super(props, props.id);
  }

  public static validateThresholds(draft: UpdateThresholdsDraft): Result<UpdateThresholdsDraft> {
    if (draft.minStock !== null && (!Number.isFinite(draft.minStock) || draft.minStock < 0)) {
      return Result.fail('El stock mínimo debe ser mayor o igual a 0, o dejarse vacío si no aplica.');
    }
    if (draft.maxStock !== null && (!Number.isFinite(draft.maxStock) || draft.maxStock < 0)) {
      return Result.fail('El stock máximo debe ser mayor o igual a 0.');
    }
    if (
      draft.minStock !== null &&
      draft.maxStock !== null &&
      draft.maxStock > 0 &&
      draft.minStock > draft.maxStock
    ) {
      return Result.fail('El stock mínimo no puede ser mayor que el stock máximo configurado.');
    }
    return Result.ok(draft);
  }

  public get raw(): Readonly<StockBalanceProps> {
    return this.props;
  }

  public get warehouseId(): string {
    return this.props.warehouseId;
  }

  public get warehouseName(): string {
    return this.props.warehouseName;
  }

  public get catalogItemId(): string {
    return this.props.catalogItemId;
  }

  public get codeReference(): string {
    return this.props.codeReference;
  }

  public get productName(): string {
    return this.props.productName;
  }

  public get qtyAvailable(): number {
    return this.props.qtyAvailable;
  }

  public get qtyOnHand(): number {
    return this.props.qtyOnHand;
  }

  public get qtyInTransit(): number {
    return this.props.qtyInTransit;
  }

  public get averageCost(): number {
    return this.props.averageCost;
  }

  public get minStock(): number | null {
    return this.props.minStock;
  }

  public get maxStock(): number | null {
    return this.props.maxStock;
  }

  public get lowStockAlertEnabled(): boolean {
    return this.props.lowStockAlertEnabled;
  }

  public get isLowStock(): boolean {
    return (
      this.props.lowStockAlertEnabled &&
      this.props.minStock !== null &&
      this.props.qtyAvailable <= this.props.minStock
    );
  }

  public get totalValuationCop(): number {
    return Math.round(Math.max(0, this.props.qtyOnHand) * this.props.averageCost);
  }

  public get formattedAverageCost(): string {
    return `$ ${Math.round(this.props.averageCost).toLocaleString('es-CO')}`;
  }

  public get formattedValuation(): string {
    return `$ ${this.totalValuationCop.toLocaleString('es-CO')}`;
  }
}
