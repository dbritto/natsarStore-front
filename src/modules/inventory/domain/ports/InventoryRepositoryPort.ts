import { Result } from '@shared/domain/Result';
import {
  SaveWarehouseDraft,
  WarehouseModel,
} from '../models/Warehouse.model';
import {
  StockBalanceModel,
  UpdateThresholdsDraft,
} from '../models/StockBalance.model';
import {
  InventoryReasonDto,
  KardexMovementModel,
  RegisterMovementDraft,
} from '../models/KardexMovement.model';

export interface BalancesFilter {
  warehouseId?: string;
  lowStockOnly?: boolean;
  search?: string;
}

export interface KardexFilter {
  warehouseId?: string;
  catalogItemId?: string;
  reasonCode?: string;
}

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo de Inventario, Bodegas y Kárdex.
 */
export interface InventoryRepositoryPort {
  // Bodegas (/api/v1/inventory/warehouses)
  listWarehouses(search?: string): Promise<Result<WarehouseModel[]>>;
  createWarehouse(draft: SaveWarehouseDraft): Promise<Result<WarehouseModel>>;
  updateWarehouse(id: string, draft: Partial<SaveWarehouseDraft>): Promise<Result<WarehouseModel>>;
  deleteWarehouse(id: string): Promise<Result<void>>;

  // Catálogo de Motivos (/api/v1/inventory/reasons)
  listReasons(): Promise<Result<InventoryReasonDto[]>>;

  // Saldos y Umbrales (/api/v1/inventory/balances & /thresholds)
  listBalances(filter?: BalancesFilter): Promise<Result<StockBalanceModel[]>>;
  updateThresholds(draft: UpdateThresholdsDraft): Promise<Result<StockBalanceModel>>;

  // Movimientos y Kárdex Inmutable (/api/v1/inventory/movements & /kardex)
  registerMovement(draft: RegisterMovementDraft): Promise<Result<KardexMovementModel>>;
  listKardex(filter?: KardexFilter): Promise<Result<KardexMovementModel[]>>;
}
