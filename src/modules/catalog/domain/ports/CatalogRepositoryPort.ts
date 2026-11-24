import { Result } from '@shared/domain/Result';
import {
  CatalogProduct,
  CreateProductInput,
  ProductCategory,
  UpdateProductInput,
} from '../models/CatalogProduct.model';

export interface CatalogQueryParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CatalogRepositoryPort {
  getProducts(params?: CatalogQueryParams): Promise<Result<{ items: CatalogProduct[]; total: number }>>;
  getCategories(): Promise<Result<ProductCategory[]>>;
  getProductById(id: string): Promise<Result<CatalogProduct>>;
  createProduct(input: CreateProductInput): Promise<Result<CatalogProduct>>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Result<CatalogProduct>>;
  deleteProduct(id: string): Promise<Result<void>>;
  uploadProductImage(file: File): Promise<Result<{ mediaId: string; url: string }>>;
}
