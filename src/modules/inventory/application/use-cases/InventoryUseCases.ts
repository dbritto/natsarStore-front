import { Result } from '@shared/domain/Result';
import {
  SaveWarehouseDraft,
  WarehouseModel,
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
import {
  BalancesFilter,
  InventoryRepositoryPort,
  KardexFilter,
} from '../../domain/ports/InventoryRepositoryPort';

/**
 * Casos de Uso del Módulo de Inventario, Bodegas y Kárdex (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class InventoryUseCases {
  constructor(private readonly repository: InventoryRepositoryPort) {}

  public async getWarehouses(search?: string): Promise<Result<WarehouseModel[]>> {
    return this.repository.listWarehouses(search);
  }

  public async createWarehouse(draft: SaveWarehouseDraft): Promise<Result<WarehouseModel>> {
    const validOrErr = WarehouseModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createWarehouse(validOrErr.getValue());
  }

  public async updateWarehouse(
    id: string,
    draft: SaveWarehouseDraft
  ): Promise<Result<WarehouseModel>> {
    const validOrErr = WarehouseModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateWarehouse(id, validOrErr.getValue());
  }

  public async deleteWarehouse(warehouse: WarehouseModel): Promise<Result<void>> {
    if (warehouse.isDefaultPos) {
      return Result.fail(
        'No es posible eliminar la bodega POS predeterminada de la sede.'
      );
    }
    return this.repository.deleteWarehouse(warehouse.id);
  }

  public async getReasons(): Promise<Result<InventoryReasonDto[]>> {
    return this.repository.listReasons();
  }

  public async getBalances(filter?: BalancesFilter): Promise<Result<StockBalanceModel[]>> {
    return this.repository.listBalances(filter);
  }

  public async saveThresholds(draft: UpdateThresholdsDraft): Promise<Result<StockBalanceModel>> {
    const validOrErr = StockBalanceModel.validateThresholds(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateThresholds(validOrErr.getValue());
  }

  public async createMovement(draft: RegisterMovementDraft): Promise<Result<KardexMovementModel>> {
    const validOrErr = KardexMovementModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.registerMovement(validOrErr.getValue());
  }

  public async getKardex(filter?: KardexFilter): Promise<Result<KardexMovementModel[]>> {
    return this.repository.listKardex(filter);
  }
}
