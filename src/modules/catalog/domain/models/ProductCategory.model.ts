import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface ProductCategoryProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SaveCategoryDraft {
  code: string;
  name: string;
  description?: string | null;
  colorHex?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Entidad / Modelo de Dominio ProductCategoryModel (DDD - Diseño en Modelos)
 * Homologado con las invariantes del backend (`/api/v1/catalog/categories`).
 */
export class ProductCategoryModel extends Entity<ProductCategoryProps> {
  private static readonly CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;
  private static readonly HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

  constructor(props: ProductCategoryProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveCategoryDraft): Result<SaveCategoryDraft> {
    const code = (draft.code ?? '').trim().toUpperCase();
    if (!this.CODE_REGEX.test(code)) {
      return Result.fail(
        'El código de la categoría debe tener entre 2 y 40 caracteres alfanuméricos, guiones o guiones bajos.'
      );
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 150) {
      return Result.fail('El nombre de la categoría debe tener entre 2 y 150 caracteres.');
    }

    const colorHex = draft.colorHex ? draft.colorHex.trim() : '#4D53F4';
    if (colorHex && !this.HEX_REGEX.test(colorHex)) {
      return Result.fail('El color de la categoría debe tener formato hexadecimal válido (#RRGGBB).');
    }

    const sortOrder = Number(draft.sortOrder ?? 0);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return Result.fail('El orden de visualización debe ser un número entero mayor o igual a 0.');
    }

    return Result.ok({
      code,
      name,
      description: draft.description?.trim() || null,
      colorHex,
      sortOrder,
      isActive: draft.isActive ?? true,
    });
  }

  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get colorHex(): string {
    return this.props.colorHex || '#4D53F4';
  }

  public get sortOrder(): number {
    return this.props.sortOrder;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isProtectedSystemCategory(): boolean {
    return this.props.code.toUpperCase() === 'GENERAL';
  }
}
