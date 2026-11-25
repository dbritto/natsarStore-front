import { Result } from '@shared/domain/Result';
import {
  ProductCategoryModel,
  SaveCategoryDraft,
} from '../models/ProductCategory.model';
import {
  CatalogItemModel,
  CatalogItemType,
  ProductImageRecordDto,
  SaveCatalogItemDraft,
} from '../models/CatalogItem.model';
import { BarcodeEntryProps } from '../value-objects/BarcodeEntry.vo';

export interface CatalogItemsFilter {
  search?: string;
  categoryId?: string;
  itemType?: CatalogItemType | '';
}

export interface BarcodeScanMatch {
  matchedBarcode: BarcodeEntryProps;
  item: CatalogItemModel;
}

export interface UploadProductImagePayload {
  fileName: string;
  content: string; // Base64 o data URL
  mimeType: string;
  isPrimary?: boolean;
  notes?: string;
}

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo de Catálogo Comercial.
 * Cubre todos los endpoints de Categorías, Productos, Escáner de Código de Barras y Galería de Imágenes.
 */
export interface CatalogRepositoryPort {
  // Categorías POS (/api/v1/catalog/categories)
  listCategories(search?: string): Promise<Result<ProductCategoryModel[]>>;
  createCategory(draft: SaveCategoryDraft): Promise<Result<ProductCategoryModel>>;
  updateCategory(id: string, draft: Partial<SaveCategoryDraft>): Promise<Result<ProductCategoryModel>>;
  deleteCategory(id: string): Promise<Result<void>>;

  // Productos, Servicios y Combos (/api/v1/catalog/items)
  listItems(filter?: CatalogItemsFilter): Promise<Result<CatalogItemModel[]>>;
  findByBarcode(barcode: string): Promise<Result<BarcodeScanMatch>>;
  createItem(draft: SaveCatalogItemDraft): Promise<Result<CatalogItemModel>>;
  updateItem(id: string, draft: Partial<SaveCatalogItemDraft>): Promise<Result<CatalogItemModel>>;
  deleteItem(id: string): Promise<Result<void>>;

  // Galería Multi-Imagen (/api/v1/catalog/items/{id}/images)
  getItemImages(catalogItemId: string): Promise<Result<ProductImageRecordDto[]>>;
  addItemImage(
    catalogItemId: string,
    payload: UploadProductImagePayload
  ): Promise<Result<ProductImageRecordDto[]>>;
  setPrimaryImage(catalogItemId: string, imageId: string): Promise<Result<void>>;
  deleteItemImage(catalogItemId: string, imageId: string): Promise<Result<void>>;
}
