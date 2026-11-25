import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';
import { BarcodeEntry, BarcodeEntryProps } from '../value-objects/BarcodeEntry.vo';

export type CatalogItemType = 'PRODUCT' | 'SERVICE' | 'COMBO';
export type DianTaxCode = '01' | '04' | '34' | '35' | 'ZZ';
export type ProductStandardCode = '999' | '001' | '010';

export interface ProductImageRecordDto {
  id: string;
  catalogItemId: string;
  mediaFileId: string;
  fileName: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  sortOrder: number;
  isPrimary: boolean;
  notes?: string | null;
}

export interface CatalogItemProps {
  id: string;
  itemType: CatalogItemType;
  codeReference: string;
  sku: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  brand: string | null;
  standardCode: ProductStandardCode;
  unitMeasureCode: string;
  basePrice: number;
  unitCost: number;
  isTaxExcluded: boolean;
  isTaxIncludedInPrice: boolean;
  defaultTaxCode: DianTaxCode;
  defaultTaxRate: number;
  trackInventory: boolean;
  allowFractionalQty: boolean;
  primaryImage: {
    id: string;
    fileName: string;
    url: string;
  } | null;
  barcodes: BarcodeEntryProps[];
  isActive: boolean;
}

export interface SaveCatalogItemDraft {
  itemType: CatalogItemType;
  codeReference: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  brand?: string | null;
  standardCode?: ProductStandardCode;
  unitMeasureCode?: string;
  basePrice: number;
  unitCost: number;
  isTaxExcluded?: boolean;
  isTaxIncludedInPrice?: boolean;
  defaultTaxCode: DianTaxCode;
  defaultTaxRate: number;
  trackInventory?: boolean;
  barcodes?: BarcodeEntryProps[];
  isActive?: boolean;
}

/**
 * Entidad / Modelo Rico de Dominio CatalogItemModel (DDD - Diseño en Modelos)
 * Encapsula la lógica fiscal DIAN (desglose de precio neto antes de IVA/INC, cálculo de margen bruto,
 * códigos de barras con factor de conversión y galería de imágenes).
 */
export class CatalogItemModel extends Entity<CatalogItemProps> {
  constructor(props: CatalogItemProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveCatalogItemDraft): Result<SaveCatalogItemDraft> {
    const codeReference = (draft.codeReference ?? '').trim().toUpperCase();
    if (codeReference.length < 2 || codeReference.length > 50) {
      return Result.fail('La referencia del producto debe tener entre 2 y 50 caracteres.');
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 255) {
      return Result.fail('El nombre del producto debe tener entre 2 y 255 caracteres.');
    }

    const basePrice = Number(draft.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return Result.fail('El precio base de venta debe ser mayor o igual a $0.');
    }

    const unitCost = Number(draft.unitCost ?? 0);
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      return Result.fail('El costo unitario debe ser mayor o igual a $0.');
    }

    const taxRate = Number(draft.defaultTaxRate ?? 19);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return Result.fail('La tarifa de impuesto debe estar entre 0% y 100%.');
    }

    const normalizedBarcodes: BarcodeEntryProps[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < (draft.barcodes ?? []).length; i++) {
      const raw = draft.barcodes![i];
      const voOrErr = BarcodeEntry.create({
        ...raw,
        isPrimary: i === 0 ? true : Boolean(raw.isPrimary),
      });
      if (voOrErr.isFailure) {
        return Result.fail(voOrErr.error!);
      }
      const dto = voOrErr.getValue().toDto();
      if (seen.has(dto.barcode)) {
        return Result.fail(`El código de barras '${dto.barcode}' está repetido en el mismo producto.`);
      }
      seen.add(dto.barcode);
      normalizedBarcodes.push(dto);
    }

    const isTaxExcluded = draft.defaultTaxCode === 'ZZ' || Boolean(draft.isTaxExcluded);

    return Result.ok({
      itemType: draft.itemType ?? 'PRODUCT',
      codeReference,
      sku: draft.sku?.trim().toUpperCase() || codeReference,
      name,
      description: draft.description?.trim() || null,
      categoryId: draft.categoryId || null,
      brand: draft.brand?.trim() || null,
      standardCode: draft.standardCode ?? '999',
      unitMeasureCode: (draft.unitMeasureCode ?? '94').trim().toUpperCase(),
      basePrice,
      unitCost,
      isTaxExcluded,
      isTaxIncludedInPrice: draft.isTaxIncludedInPrice ?? true,
      defaultTaxCode: isTaxExcluded ? 'ZZ' : draft.defaultTaxCode,
      defaultTaxRate: isTaxExcluded ? 0 : taxRate,
      trackInventory: draft.itemType === 'SERVICE' ? false : (draft.trackInventory ?? true),
      barcodes: normalizedBarcodes,
      isActive: draft.isActive ?? true,
    });
  }

  public get raw(): Readonly<CatalogItemProps> {
    return this.props;
  }

  public get codeReference(): string {
    return this.props.codeReference;
  }

  public get name(): string {
    return this.props.name;
  }

  public get itemType(): CatalogItemType {
    return this.props.itemType;
  }

  public get itemTypeLabel(): string {
    const map: Record<CatalogItemType, string> = {
      PRODUCT: 'Producto Físico',
      SERVICE: 'Servicio',
      COMBO: 'Combo / Kit',
    };
    return map[this.props.itemType] ?? this.props.itemType;
  }

  public get categoryId(): string | null {
    return this.props.categoryId;
  }

  public get basePrice(): number {
    return this.props.basePrice;
  }

  public get unitCost(): number {
    return this.props.unitCost;
  }

  /**
   * Precio unitario neto antes de IVA/INC (idéntico a CatalogItem.getNetUnitPrice() del backend).
   */
  public get netUnitPrice(): number {
    if (!this.props.isTaxIncludedInPrice || this.props.isTaxExcluded || this.props.defaultTaxRate <= 0) {
      return this.props.basePrice;
    }
    return Math.round(this.props.basePrice / (1 + this.props.defaultTaxRate / 100));
  }

  /**
   * Margen bruto estimado sobre el precio neto antes de impuestos.
   */
  public get grossMarginPct(): number {
    const net = this.netUnitPrice;
    if (net <= 0) return 0;
    const profit = net - this.props.unitCost;
    return Number(((profit / net) * 100).toFixed(1));
  }

  public get taxBadgeLabel(): string {
    if (this.props.isTaxExcluded || this.props.defaultTaxCode === 'ZZ') {
      return 'Excluido (ZZ)';
    }
    const names: Record<DianTaxCode, string> = {
      '01': 'IVA',
      '04': 'INC',
      '34': 'IBUA',
      '35': 'ICUI',
      ZZ: 'Excluido',
    };
    const label = names[this.props.defaultTaxCode] ?? 'IVA';
    return `${label} ${this.props.defaultTaxRate}%`;
  }

  public get formattedBasePrice(): string {
    return `$ ${this.props.basePrice.toLocaleString('es-CO')}`;
  }

  public get formattedNetPrice(): string {
    return `$ ${this.netUnitPrice.toLocaleString('es-CO')}`;
  }

  public get formattedUnitCost(): string {
    return `$ ${this.props.unitCost.toLocaleString('es-CO')}`;
  }

  public get barcodes(): BarcodeEntryProps[] {
    return this.props.barcodes ?? [];
  }

  public get primaryImageUrl(): string | null {
    return this.props.primaryImage?.url ?? null;
  }
}
