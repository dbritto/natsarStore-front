export interface ProductBarcode {
  barcode: string;
  isPrimary?: boolean;
}

export interface CatalogProductPrimaryImage {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string | null;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  colorHex?: string | null;
}

export interface CatalogProduct {
  id: string;
  codeReference: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  brand?: string | null;
  basePrice: number;
  netUnitPrice: number;
  unitCost?: number;
  isTaxExcluded: boolean;
  isTaxIncludedInPrice: boolean;
  defaultTaxCode: string | null;
  defaultTaxRate: number;
  trackInventory: boolean;
  barcodes: ProductBarcode[];
  primaryImageMediaId?: string | null;
  primaryImage?: CatalogProductPrimaryImage | null;
  isActive: boolean;
  createdAt?: string | Date;
}

export interface CreateProductInput {
  codeReference: string;
  sku?: string;
  name: string;
  description?: string;
  basePrice: number;
  unitCost?: number;
  categoryId?: string;
  brand?: string;
  defaultTaxCode?: string;
  defaultTaxRate?: number;
  isTaxIncludedInPrice?: boolean;
  trackInventory?: boolean;
  barcodes?: ProductBarcode[];
  primaryImageMediaId?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}
