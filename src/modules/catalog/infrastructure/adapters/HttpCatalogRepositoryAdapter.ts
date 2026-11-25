import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  ProductCategoryModel,
  ProductCategoryProps,
  SaveCategoryDraft,
} from '../../domain/models/ProductCategory.model';
import {
  CatalogItemModel,
  CatalogItemProps,
  ProductImageRecordDto,
  SaveCatalogItemDraft,
} from '../../domain/models/CatalogItem.model';
import {
  BarcodeScanMatch,
  CatalogItemsFilter,
  CatalogRepositoryPort,
  UploadProductImagePayload,
} from '../../domain/ports/CatalogRepositoryPort';

const INITIAL_CATEGORIES: ProductCategoryProps[] = [
  {
    id: 'cat-general-001',
    code: 'GENERAL',
    name: 'General / Mostrador',
    description: 'Categoría base protegida del sistema POS',
    parentId: null,
    colorHex: '#4D53F4',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'cat-cafe-002',
    code: 'CAFE_BEBIDAS',
    name: 'Cafetería & Bebidas Especiales',
    description: 'Productos gravados con INC 8% de consumo para cafetería y restaurante',
    parentId: null,
    colorHex: '#10B981',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-hardware-003',
    code: 'HARDWARE_POS',
    name: 'Terminales & Hardware POS',
    description: 'Lectores de códigos de barras 2D, impresoras térmicas y cajones monederos',
    parentId: null,
    colorHex: '#6366F1',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-cloud-004',
    code: 'SERVICIOS_DIAN',
    name: 'Folios & Servicios Cloud DIAN',
    description: 'Suscripciones y paquetes de emisión electrónica UBL 2.1',
    parentId: null,
    colorHex: '#F59E0B',
    sortOrder: 3,
    isActive: true,
  },
];

const INITIAL_ITEMS: CatalogItemProps[] = [
  {
    id: 'item-pos-001',
    itemType: 'PRODUCT',
    codeReference: 'CAFE-HUI-500',
    sku: 'SKU-CAFE-500',
    name: 'Café Especial Origen Huila 500g',
    description: 'Café tostado en grano selección gourmet con Impuesto Nacional al Consumo (INC 8%)',
    categoryId: 'cat-cafe-002',
    brand: 'Natsar Coffee Reserve',
    standardCode: '999',
    unitMeasureCode: '94',
    basePrice: 38500,
    unitCost: 16500,
    isTaxExcluded: false,
    isTaxIncludedInPrice: true,
    defaultTaxCode: '04',
    defaultTaxRate: 8,
    trackInventory: true,
    allowFractionalQty: false,
    primaryImage: null,
    barcodes: [
      {
        barcode: '7701234500018',
        barcodeType: 'EAN13',
        unitMeasureCode: '94',
        conversionFactor: 1,
        isPrimary: true,
        isActive: true,
      },
      {
        barcode: '17701234500015',
        barcodeType: 'EAN14',
        unitMeasureCode: 'BX',
        conversionFactor: 12,
        isPrimary: false,
        isActive: true,
      },
    ],
    isActive: true,
  },
  {
    id: 'item-pos-002',
    itemType: 'PRODUCT',
    codeReference: 'POS-SCAN-2D',
    sku: 'SKU-SCAN-2D',
    name: 'Lector Código de Barras Inalámbrico 2D QR/EAN',
    description: 'Escáner omnidireccional de alta velocidad para punto de venta',
    categoryId: 'cat-hardware-003',
    brand: 'NatsarTech',
    standardCode: '010',
    unitMeasureCode: '94',
    basePrice: 285000,
    unitCost: 135000,
    isTaxExcluded: false,
    isTaxIncludedInPrice: true,
    defaultTaxCode: '01',
    defaultTaxRate: 19,
    trackInventory: true,
    allowFractionalQty: false,
    primaryImage: null,
    barcodes: [
      {
        barcode: '7701234500025',
        barcodeType: 'EAN13',
        unitMeasureCode: '94',
        conversionFactor: 1,
        isPrimary: true,
        isActive: true,
      },
    ],
    isActive: true,
  },
  {
    id: 'item-pos-003',
    itemType: 'PRODUCT',
    codeReference: 'IMP-TERM-80',
    sku: 'SKU-IMP-80',
    name: 'Impresora Térmica 80mm Autocorte USB + Ethernet',
    description: 'Impresora de tirillas POS compatible con código QR DIAN y comandos ESC/POS',
    categoryId: 'cat-hardware-003',
    brand: 'NatsarTech',
    standardCode: '010',
    unitMeasureCode: '94',
    basePrice: 460000,
    unitCost: 210000,
    isTaxExcluded: false,
    isTaxIncludedInPrice: true,
    defaultTaxCode: '01',
    defaultTaxRate: 19,
    trackInventory: true,
    allowFractionalQty: false,
    primaryImage: null,
    barcodes: [
      {
        barcode: '7701234500032',
        barcodeType: 'EAN13',
        unitMeasureCode: '94',
        conversionFactor: 1,
        isPrimary: true,
        isActive: true,
      },
    ],
    isActive: true,
  },
  {
    id: 'item-pos-004',
    itemType: 'SERVICE',
    codeReference: 'FOL-DIAN-1K',
    sku: 'SRV-FOL-1000',
    name: 'Paquete 1.000 Folios Facturación Electrónica DIAN',
    description: 'Habilitación y transmisión automática Anexo Técnico 1.9 UBL 2.1',
    categoryId: 'cat-cloud-004',
    brand: 'NatsarCloud',
    standardCode: '999',
    unitMeasureCode: '94',
    basePrice: 190000,
    unitCost: 45000,
    isTaxExcluded: false,
    isTaxIncludedInPrice: true,
    defaultTaxCode: '01',
    defaultTaxRate: 19,
    trackInventory: false,
    allowFractionalQty: false,
    primaryImage: null,
    barcodes: [
      {
        barcode: '7701234500049',
        barcodeType: 'CODE128',
        unitMeasureCode: '94',
        conversionFactor: 1,
        isPrimary: true,
        isActive: true,
      },
    ],
    isActive: true,
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para el Módulo de Catálogo Comercial.
 * Conecta directamente con los endpoints `/api/v1/catalog/*` del Swagger y mantiene sincronizado
 * el estado en memoria cuando se opera sin datos semilla remotos.
 */
export class HttpCatalogRepositoryAdapter implements CatalogRepositoryPort {
  private localCategories: ProductCategoryProps[] = [...INITIAL_CATEGORIES];
  private localItems: CatalogItemProps[] = [...INITIAL_ITEMS];
  private localGalleries = new Map<string, ProductImageRecordDto[]>();

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listCategories(search?: string): Promise<Result<ProductCategoryModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: ProductCategoryProps[] }>(
        '/api/v1/catalog/categories',
        { params: { page: 1, limit: 50, search } }
      );

      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localCategories = response.data.items;
      }
    } catch {
      // Continuar con estado local sincronizado
    }

    const q = (search ?? '').trim().toLowerCase();
    const filtered = this.localCategories
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return Result.ok(filtered.map((c) => new ProductCategoryModel(c)));
  }

  public async createCategory(draft: SaveCategoryDraft): Promise<Result<ProductCategoryModel>> {
    try {
      const response = await this.httpClient.post<ProductCategoryProps>(
        '/api/v1/catalog/categories',
        draft
      );
      if (response.success && response.data) {
        const created = response.data;
        this.localCategories = [...this.localCategories, created];
        return Result.ok(new ProductCategoryModel(created));
      }
    } catch {
      // Fallback local
    }

    if (this.localCategories.some((c) => c.code === draft.code)) {
      return Result.fail(`Ya existe una categoría con el código '${draft.code}'.`);
    }

    const created: ProductCategoryProps = {
      id: `cat-${Date.now()}`,
      code: draft.code,
      name: draft.name,
      description: draft.description ?? null,
      parentId: null,
      colorHex: draft.colorHex ?? '#4D53F4',
      sortOrder: draft.sortOrder ?? this.localCategories.length,
      isActive: draft.isActive ?? true,
    };

    this.localCategories = [...this.localCategories, created];
    return Result.ok(new ProductCategoryModel(created));
  }

  public async updateCategory(
    id: string,
    draft: Partial<SaveCategoryDraft>
  ): Promise<Result<ProductCategoryModel>> {
    try {
      const response = await this.httpClient.patch<ProductCategoryProps>(
        `/api/v1/catalog/categories/${id}`,
        draft
      );
      if (response.success && response.data) {
        this.localCategories = this.localCategories.map((c) =>
          c.id === id ? response.data! : c
        );
        return Result.ok(new ProductCategoryModel(response.data));
      }
    } catch {
      // Fallback local
    }

    const existing = this.localCategories.find((c) => c.id === id);
    if (!existing) {
      return Result.fail('No encontramos la categoría solicitada.');
    }

    const updated: ProductCategoryProps = {
      ...existing,
      name: draft.name ?? existing.name,
      description: draft.description !== undefined ? (draft.description ?? null) : existing.description,
      colorHex: draft.colorHex !== undefined ? (draft.colorHex ?? '#4D53F4') : existing.colorHex,
      sortOrder: draft.sortOrder ?? existing.sortOrder,
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localCategories = this.localCategories.map((c) => (c.id === id ? updated : c));
    return Result.ok(new ProductCategoryModel(updated));
  }

  public async deleteCategory(id: string): Promise<Result<void>> {
    const hasAssociatedProducts = this.localItems.some((item) => item.categoryId === id);
    if (hasAssociatedProducts) {
      return Result.fail(
        'No es posible eliminar esta categoría porque tiene productos asociados. Reasigna los productos primero.'
      );
    }

    try {
      await this.httpClient.delete(`/api/v1/catalog/categories/${id}`);
    } catch {
      // Fallback local
    }

    this.localCategories = this.localCategories.filter((c) => c.id !== id);
    return Result.ok();
  }

  public async listItems(filter?: CatalogItemsFilter): Promise<Result<CatalogItemModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: CatalogItemProps[] }>(
        '/api/v1/catalog/items',
        {
          params: {
            page: 1,
            limit: 50,
            search: filter?.search,
            categoryId: filter?.categoryId,
            itemType: filter?.itemType || undefined,
          },
        }
      );

      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localItems = response.data.items;
      }
    } catch {
      // Continuar con estado local sincronizado
    }

    const q = (filter?.search ?? '').trim().toLowerCase();
    const filtered = this.localItems.filter((item) => {
      if (filter?.categoryId && item.categoryId !== filter.categoryId) return false;
      if (filter?.itemType && item.itemType !== filter.itemType) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.codeReference.toLowerCase().includes(q) ||
        (item.sku ?? '').toLowerCase().includes(q) ||
        item.barcodes.some((b) => b.barcode.toLowerCase().includes(q))
      );
    });

    return Result.ok(filtered.map((item) => new CatalogItemModel(item)));
  }

  public async findByBarcode(barcode: string): Promise<Result<BarcodeScanMatch>> {
    try {
      const response = await this.httpClient.get<{
        matchedBarcode: CatalogItemProps['barcodes'][0];
        item: CatalogItemProps;
      }>(`/api/v1/catalog/items/barcode/${encodeURIComponent(barcode)}`);

      if (response.success && response.data?.item) {
        return Result.ok({
          matchedBarcode: response.data.matchedBarcode,
          item: new CatalogItemModel(response.data.item),
        });
      }
    } catch {
      // Búsqueda en catálogo cargado
    }

    for (const item of this.localItems) {
      const match = item.barcodes.find(
        (b) => b.barcode.toLowerCase() === barcode.toLowerCase()
      );
      if (match) {
        return Result.ok({
          matchedBarcode: match,
          item: new CatalogItemModel(item),
        });
      }
    }

    return Result.fail(
      `No encontramos ningún producto asociado al código de barras '${barcode}'.`
    );
  }

  public async createItem(draft: SaveCatalogItemDraft): Promise<Result<CatalogItemModel>> {
    try {
      const response = await this.httpClient.post<CatalogItemProps>('/api/v1/catalog/items', draft);
      if (response.success && response.data) {
        this.localItems = [response.data, ...this.localItems];
        return Result.ok(new CatalogItemModel(response.data));
      }
    } catch {
      // Fallback local
    }

    if (this.localItems.some((i) => i.codeReference === draft.codeReference)) {
      return Result.fail(`Ya existe un producto con la referencia '${draft.codeReference}'.`);
    }

    const created: CatalogItemProps = {
      id: `item-${Date.now()}`,
      itemType: draft.itemType,
      codeReference: draft.codeReference,
      sku: draft.sku ?? draft.codeReference,
      name: draft.name,
      description: draft.description ?? null,
      categoryId: draft.categoryId ?? null,
      brand: draft.brand ?? null,
      standardCode: draft.standardCode ?? '999',
      unitMeasureCode: draft.unitMeasureCode ?? '94',
      basePrice: draft.basePrice,
      unitCost: draft.unitCost,
      isTaxExcluded: Boolean(draft.isTaxExcluded),
      isTaxIncludedInPrice: draft.isTaxIncludedInPrice ?? true,
      defaultTaxCode: draft.defaultTaxCode,
      defaultTaxRate: draft.defaultTaxRate,
      trackInventory: draft.trackInventory ?? true,
      allowFractionalQty: false,
      primaryImage: null,
      barcodes: draft.barcodes ?? [],
      isActive: draft.isActive ?? true,
    };

    this.localItems = [created, ...this.localItems];
    return Result.ok(new CatalogItemModel(created));
  }

  public async updateItem(
    id: string,
    draft: Partial<SaveCatalogItemDraft>
  ): Promise<Result<CatalogItemModel>> {
    try {
      const response = await this.httpClient.patch<CatalogItemProps>(
        `/api/v1/catalog/items/${id}`,
        draft
      );
      if (response.success && response.data) {
        this.localItems = this.localItems.map((i) => (i.id === id ? response.data! : i));
        return Result.ok(new CatalogItemModel(response.data));
      }
    } catch {
      // Fallback local
    }

    const existing = this.localItems.find((i) => i.id === id);
    if (!existing) {
      return Result.fail('No encontramos el producto solicitado.');
    }

    const updated: CatalogItemProps = {
      ...existing,
      itemType: draft.itemType ?? existing.itemType,
      name: draft.name ?? existing.name,
      sku: draft.sku !== undefined ? (draft.sku ?? null) : existing.sku,
      description:
        draft.description !== undefined ? (draft.description ?? null) : existing.description,
      categoryId:
        draft.categoryId !== undefined ? (draft.categoryId ?? null) : existing.categoryId,
      brand: draft.brand !== undefined ? (draft.brand ?? null) : existing.brand,
      standardCode: draft.standardCode ?? existing.standardCode,
      unitMeasureCode: draft.unitMeasureCode ?? existing.unitMeasureCode,
      basePrice: draft.basePrice ?? existing.basePrice,
      unitCost: draft.unitCost ?? existing.unitCost,
      isTaxExcluded: draft.isTaxExcluded ?? existing.isTaxExcluded,
      isTaxIncludedInPrice: draft.isTaxIncludedInPrice ?? existing.isTaxIncludedInPrice,
      defaultTaxCode: draft.defaultTaxCode ?? existing.defaultTaxCode,
      defaultTaxRate: draft.defaultTaxRate ?? existing.defaultTaxRate,
      trackInventory: draft.trackInventory ?? existing.trackInventory,
      barcodes: draft.barcodes ?? existing.barcodes,
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localItems = this.localItems.map((i) => (i.id === id ? updated : i));
    return Result.ok(new CatalogItemModel(updated));
  }

  public async deleteItem(id: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/catalog/items/${id}`);
    } catch {
      // Fallback local
    }
    this.localItems = this.localItems.filter((i) => i.id !== id);
    return Result.ok();
  }

  public async getItemImages(catalogItemId: string): Promise<Result<ProductImageRecordDto[]>> {
    try {
      const response = await this.httpClient.get<{ images: ProductImageRecordDto[] }>(
        `/api/v1/catalog/items/${catalogItemId}/images`
      );
      if (response.success && response.data?.images) {
        this.localGalleries.set(catalogItemId, response.data.images);
        return Result.ok(response.data.images);
      }
    } catch {
      // Fallback local
    }
    return Result.ok(this.localGalleries.get(catalogItemId) ?? []);
  }

  public async addItemImage(
    catalogItemId: string,
    payload: UploadProductImagePayload
  ): Promise<Result<ProductImageRecordDto[]>> {
    try {
      const base64Clean = payload.content.includes(',')
        ? payload.content.split(',')[1]
        : payload.content;
      const response = await this.httpClient.post<ProductImageRecordDto[]>(
        `/api/v1/catalog/items/${catalogItemId}/images`,
        {
          images: [
            {
              fileName: payload.fileName,
              content: base64Clean,
              mimeType: payload.mimeType,
              isPrimary: payload.isPrimary,
              notes: payload.notes,
            },
          ],
        }
      );
      if (response.success && response.data) {
        const current = await this.getItemImages(catalogItemId);
        return current;
      }
    } catch {
      // Fallback local
    }

    const currentList = this.localGalleries.get(catalogItemId) ?? [];
    const shouldBePrimary = payload.isPrimary || currentList.length === 0;
    const normalizedList = shouldBePrimary
      ? currentList.map((img) => ({ ...img, isPrimary: false }))
      : currentList;

    const newImg: ProductImageRecordDto = {
      id: `img-${Date.now()}`,
      catalogItemId,
      mediaFileId: `media-${Date.now()}`,
      fileName: payload.fileName,
      url: payload.content,
      mimeType: payload.mimeType,
      sortOrder: normalizedList.length,
      isPrimary: shouldBePrimary,
      notes: payload.notes ?? null,
    };

    const nextList = [...normalizedList, newImg];
    this.localGalleries.set(catalogItemId, nextList);

    if (shouldBePrimary) {
      this.localItems = this.localItems.map((item) =>
        item.id === catalogItemId
          ? {
              ...item,
              primaryImage: { id: newImg.mediaFileId, fileName: newImg.fileName, url: newImg.url },
            }
          : item
      );
    }

    return Result.ok(nextList);
  }

  public async setPrimaryImage(catalogItemId: string, imageId: string): Promise<Result<void>> {
    try {
      await this.httpClient.patch(
        `/api/v1/catalog/items/${catalogItemId}/images/${imageId}`,
        { isPrimary: true }
      );
    } catch {
      // Fallback local
    }

    const currentList = this.localGalleries.get(catalogItemId) ?? [];
    let newPrimaryUrl: string | null = null;
    let newPrimaryFile = '';
    const updatedList = currentList.map((img) => {
      const isTarget = img.id === imageId;
      if (isTarget) {
        newPrimaryUrl = img.url;
        newPrimaryFile = img.fileName;
      }
      return { ...img, isPrimary: isTarget };
    });

    this.localGalleries.set(catalogItemId, updatedList);
    if (newPrimaryUrl) {
      this.localItems = this.localItems.map((item) =>
        item.id === catalogItemId
          ? {
              ...item,
              primaryImage: { id: imageId, fileName: newPrimaryFile, url: newPrimaryUrl! },
            }
          : item
      );
    }

    return Result.ok();
  }

  public async deleteItemImage(catalogItemId: string, imageId: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/catalog/items/${catalogItemId}/images/${imageId}`);
    } catch {
      // Fallback local
    }

    const currentList = (this.localGalleries.get(catalogItemId) ?? []).filter(
      (img) => img.id !== imageId
    );
    if (currentList.length > 0 && !currentList.some((i) => i.isPrimary)) {
      currentList[0].isPrimary = true;
    }
    this.localGalleries.set(catalogItemId, currentList);

    const primary = currentList.find((i) => i.isPrimary) ?? null;
    this.localItems = this.localItems.map((item) =>
      item.id === catalogItemId
        ? {
            ...item,
            primaryImage: primary
              ? { id: primary.mediaFileId, fileName: primary.fileName, url: primary.url }
              : null,
          }
        : item
    );

    return Result.ok();
  }
}
