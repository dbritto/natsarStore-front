import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export type WarehouseType = 'POS_STORE' | 'BACKROOM' | 'CENTRAL' | 'DAMAGED';

export interface WarehouseProps {
  id: string;
  establishmentId: string;
  code: string;
  name: string;
  description: string | null;
  warehouseType: WarehouseType;
  isDefaultPos: boolean;
  isActive: boolean;
}

export interface SaveWarehouseDraft {
  establishmentId?: string;
  code: string;
  name: string;
  description?: string | null;
  warehouseType: WarehouseType;
  isDefaultPos?: boolean;
  isActive?: boolean;
}

/**
 * Entidad / Modelo de Dominio WarehouseModel (DDD - Diseño en Modelos)
 * Homologado con las invariantes del backend (`/api/v1/inventory/warehouses`).
 */
export class WarehouseModel extends Entity<WarehouseProps> {
  private static readonly CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

  constructor(props: WarehouseProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveWarehouseDraft): Result<SaveWarehouseDraft> {
    const code = (draft.code ?? '').trim().toUpperCase();
    if (!this.CODE_REGEX.test(code)) {
      return Result.fail(
        'El código de la bodega debe tener entre 2 y 30 caracteres alfanuméricos, guiones o guiones bajos.'
      );
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 150) {
      return Result.fail('El nombre de la bodega debe tener entre 2 y 150 caracteres.');
    }

    return Result.ok({
      establishmentId: draft.establishmentId || 'b0000000-0000-4000-8000-000000000001',
      code,
      name,
      description: draft.description?.trim() || null,
      warehouseType: draft.warehouseType ?? 'POS_STORE',
      isDefaultPos: Boolean(draft.isDefaultPos),
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

  public get warehouseType(): WarehouseType {
    return this.props.warehouseType;
  }

  public get warehouseTypeLabel(): string {
    const labels: Record<WarehouseType, string> = {
      POS_STORE: 'Mostrador / Tienda POS',
      BACKROOM: 'Trastienda / Reserva',
      CENTRAL: 'Bodega Central (CEDIS)',
      DAMAGED: 'Averías & Mermas',
    };
    return labels[this.props.warehouseType] ?? this.props.warehouseType;
  }

  public get isDefaultPos(): boolean {
    return this.props.isDefaultPos;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get establishmentId(): string {
    return this.props.establishmentId;
  }
}
