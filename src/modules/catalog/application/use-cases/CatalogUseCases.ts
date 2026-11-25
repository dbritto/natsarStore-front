import { Result } from '@shared/domain/Result';
import {
  ProductCategoryModel,
  SaveCategoryDraft,
} from '../../domain/models/ProductCategory.model';
import {
  CatalogItemModel,
  ProductImageRecordDto,
  SaveCatalogItemDraft,
} from '../../domain/models/CatalogItem.model';
import {
  BarcodeScanMatch,
  CatalogItemsFilter,
  CatalogRepositoryPort,
  UploadProductImagePayload,
} from '../../domain/ports/CatalogRepositoryPort';

/**
 * Casos de Uso del Módulo Catálogo Comercial (Capa de Aplicación - Arquitectura Hexagonal)
 * Valida las invariantes de las Entidades y Value Objects antes de invocar el puerto de salida.
 */
export class CatalogUseCases {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public async getCategories(search?: string): Promise<Result<ProductCategoryModel[]>> {
    return this.repository.listCategories(search);
  }

  public async createCategory(draft: SaveCategoryDraft): Promise<Result<ProductCategoryModel>> {
    const validOrErr = ProductCategoryModel.validateDraft(draft);
    if (validOrErr.isFailure) {
      return Result.fail(validOrErr.error!);
    }
    return this.repository.createCategory(validOrErr.getValue());
  }

  public async updateCategory(
    id: string,
    draft: SaveCategoryDraft
  ): Promise<Result<ProductCategoryModel>> {
    const validOrErr = ProductCategoryModel.validateDraft(draft);
    if (validOrErr.isFailure) {
      return Result.fail(validOrErr.error!);
    }
    return this.repository.updateCategory(id, validOrErr.getValue());
  }

  public async deleteCategory(category: ProductCategoryModel): Promise<Result<void>> {
    if (category.isProtectedSystemCategory) {
      return Result.fail('La categoría GENERAL es protegida del sistema y no puede eliminarse.');
    }
    return this.repository.deleteCategory(category.id);
  }

  public async getItems(filter?: CatalogItemsFilter): Promise<Result<CatalogItemModel[]>> {
    return this.repository.listItems(filter);
  }

  public async scanBarcode(rawBarcode: string): Promise<Result<BarcodeScanMatch>> {
    const code = (rawBarcode ?? '').trim();
    if (code.length < 3) {
      return Result.fail('Ingresa o escanea un código de barras de al menos 3 caracteres.');
    }
    return this.repository.findByBarcode(code);
  }

  public async createItem(draft: SaveCatalogItemDraft): Promise<Result<CatalogItemModel>> {
    const validOrErr = CatalogItemModel.validateDraft(draft);
    if (validOrErr.isFailure) {
      return Result.fail(validOrErr.error!);
    }
    return this.repository.createItem(validOrErr.getValue());
  }

  public async updateItem(
    id: string,
    draft: SaveCatalogItemDraft
  ): Promise<Result<CatalogItemModel>> {
    const validOrErr = CatalogItemModel.validateDraft(draft);
    if (validOrErr.isFailure) {
      return Result.fail(validOrErr.error!);
    }
    return this.repository.updateItem(id, validOrErr.getValue());
  }

  public async deleteItem(id: string): Promise<Result<void>> {
    return this.repository.deleteItem(id);
  }

  public async getItemGallery(catalogItemId: string): Promise<Result<ProductImageRecordDto[]>> {
    return this.repository.getItemImages(catalogItemId);
  }

  public async uploadItemImage(
    catalogItemId: string,
    payload: UploadProductImagePayload
  ): Promise<Result<ProductImageRecordDto[]>> {
    if (!payload.fileName || !payload.content) {
      return Result.fail('Selecciona una imagen válida para asociar al producto.');
    }
    return this.repository.addItemImage(catalogItemId, payload);
  }

  public async markPrimaryImage(catalogItemId: string, imageId: string): Promise<Result<void>> {
    return this.repository.setPrimaryImage(catalogItemId, imageId);
  }

  public async removeItemImage(catalogItemId: string, imageId: string): Promise<Result<void>> {
    return this.repository.deleteItemImage(catalogItemId, imageId);
  }
}
