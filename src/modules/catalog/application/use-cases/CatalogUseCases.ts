import { Result } from '@shared/domain/Result';
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

export class GetCatalogProductsUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(params?: CatalogQueryParams): Promise<Result<{ items: CatalogProduct[]; total: number }>> {
    return this.repository.getProducts(params);
  }
}

export class GetProductCategoriesUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(): Promise<Result<ProductCategory[]>> {
    return this.repository.getCategories();
  }
}

export class CreateCatalogProductUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(input: CreateProductInput): Promise<Result<CatalogProduct>> {
    if (!input.codeReference || !input.codeReference.trim()) {
      return Promise.resolve(Result.fail('El código o referencia del producto es obligatorio.'));
    }
    if (!input.name || !input.name.trim()) {
      return Promise.resolve(Result.fail('El nombre del producto es obligatorio.'));
    }
    if (input.basePrice === undefined || input.basePrice < 0) {
      return Promise.resolve(Result.fail('El precio base debe ser mayor o igual a 0.'));
    }
    return this.repository.createProduct(input);
  }
}

export class UpdateCatalogProductUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(id: string, input: UpdateProductInput): Promise<Result<CatalogProduct>> {
    if (!id) {
      return Promise.resolve(Result.fail('ID de producto inválido.'));
    }
    return this.repository.updateProduct(id, input);
  }
}

export class DeleteCatalogProductUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(id: string): Promise<Result<void>> {
    if (!id) {
      return Promise.resolve(Result.fail('ID de producto inválido.'));
    }
    return this.repository.deleteProduct(id);
  }
}

export class UploadProductImageUseCase {
  constructor(private readonly repository: CatalogRepositoryPort) {}

  public execute(file: File): Promise<Result<{ mediaId: string; url: string }>> {
    if (!file) {
      return Promise.resolve(Result.fail('Debe seleccionar un archivo válido.'));
    }
    if (file.size > 10 * 1024 * 1024) {
      return Promise.resolve(Result.fail('El tamaño máximo permitido para la imagen es de 10 MB.'));
    }
    return this.repository.uploadProductImage(file);
  }
}
