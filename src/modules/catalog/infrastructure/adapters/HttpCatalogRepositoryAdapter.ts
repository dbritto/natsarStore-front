import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  CatalogProduct,
  CreateProductInput,
  ProductCategory,
  UpdateProductInput,
} from '../../domain/models/CatalogProduct.model';
import {
  CatalogQueryParams,
  CatalogRepositoryPort,
} from '../../domain/ports/CatalogRepositoryPort';

export class HttpCatalogRepositoryAdapter implements CatalogRepositoryPort {
  constructor(private readonly httpClient: HttpClientPort) {}

  public async getProducts(
    params?: CatalogQueryParams
  ): Promise<Result<{ items: CatalogProduct[]; total: number }>> {
    try {
      const response = await this.httpClient.get<{
        items?: CatalogProduct[];
        total?: number;
      }>('/api/v1/catalog/items', {
        params: {
          search: params?.search,
          categoryId: params?.categoryId,
          isActive: params?.isActive,
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
        },
      });

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'No fue posible cargar el catálogo de productos.');
      }

      // El backend puede devolver { items: [...], total: N } o un arreglo directo
      const rawData = response.data as any;
      const items: CatalogProduct[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.items)
        ? rawData.items
        : [];
      const total = typeof rawData.total === 'number' ? rawData.total : items.length;

      return Result.ok({ items, total });
    } catch {
      return Result.fail('Error de comunicación al consultar el catálogo.');
    }
  }

  public async getCategories(): Promise<Result<ProductCategory[]>> {
    try {
      const response = await this.httpClient.get<ProductCategory[]>(
        '/api/v1/catalog/categories'
      );

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'No fue posible cargar las categorías.');
      }

      const list = Array.isArray(response.data) ? response.data : [];
      return Result.ok(list);
    } catch {
      return Result.fail('Error de comunicación al consultar categorías.');
    }
  }

  public async getProductById(id: string): Promise<Result<CatalogProduct>> {
    try {
      const response = await this.httpClient.get<CatalogProduct>(
        `/api/v1/catalog/items/${id}`
      );

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'Producto no encontrado.');
      }

      return Result.ok(response.data);
    } catch {
      return Result.fail('Error de comunicación al consultar el producto.');
    }
  }

  public async createProduct(input: CreateProductInput): Promise<Result<CatalogProduct>> {
    try {
      const response = await this.httpClient.post<CatalogProduct>(
        '/api/v1/catalog/items',
        {
          codeReference: input.codeReference.trim(),
          sku: input.sku?.trim() || null,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          basePrice: Number(input.basePrice),
          unitCost: input.unitCost !== undefined ? Number(input.unitCost) : undefined,
          categoryId: input.categoryId || null,
          brand: input.brand?.trim() || null,
          defaultTaxCode: input.defaultTaxCode || '01',
          defaultTaxRate: input.defaultTaxRate !== undefined ? Number(input.defaultTaxRate) : 19,
          isTaxIncludedInPrice: input.isTaxIncludedInPrice ?? true,
          trackInventory: input.trackInventory ?? true,
          barcodes: input.barcodes?.filter((b) => b.barcode.trim()) || [],
          primaryImageMediaId: input.primaryImageMediaId || null,
        }
      );

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'No fue posible registrar el producto.');
      }

      return Result.ok(response.data);
    } catch {
      return Result.fail('Error de comunicación al crear el producto.');
    }
  }

  public async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<Result<CatalogProduct>> {
    try {
      const response = await this.httpClient.patch<CatalogProduct>(
        `/api/v1/catalog/items/${id}`,
        input
      );

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'No fue posible actualizar el producto.');
      }

      return Result.ok(response.data);
    } catch {
      return Result.fail('Error de comunicación al actualizar el producto.');
    }
  }

  public async deleteProduct(id: string): Promise<Result<void>> {
    try {
      const response = await this.httpClient.delete(`/api/v1/catalog/items/${id}`);

      if (!response.success) {
        return Result.fail(response.error ?? 'No fue posible eliminar el producto.');
      }

      return Result.ok();
    } catch {
      return Result.fail('Error de comunicación al eliminar el producto.');
    }
  }

  public async uploadProductImage(file: File): Promise<Result<{ mediaId: string; url: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryCode', 'PRODUCTOS');

      const response = await this.httpClient.post<{
        id: string;
        url: string;
        fileName: string;
      }>('/api/v1/media/upload', formData);

      if (!response.success || !response.data) {
        return Result.fail(response.error ?? 'No fue posible subir la imagen.');
      }

      return Result.ok({
        mediaId: response.data.id,
        url: response.data.url,
      });
    } catch {
      return Result.fail('Error de comunicación al subir la imagen a Supabase Storage.');
    }
  }
}
