import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface RbacPermissionDto {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
  isActive: boolean;
}

export interface RbacRoleProps {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface SaveRbacRoleDraft {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  isActive?: boolean;
}

export interface SaveRbacPermissionDraft {
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

/**
 * Entidad / Modelo de Dominio RbacRoleModel (DDD - Diseño en Modelos)
 * Homologado con `/api/v1/auth/roles` y comodín dinámico `superAdmin:*`.
 */
export class RbacRoleModel extends Entity<RbacRoleProps> {
  private static readonly CODE_REGEX = /^[A-Z0-9][A-Z0-9_]{1,39}$/;

  constructor(props: RbacRoleProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveRbacRoleDraft): Result<SaveRbacRoleDraft> {
    const code = (draft.code ?? '').trim().toUpperCase();
    if (!this.CODE_REGEX.test(code)) {
      return Result.fail(
        'El código del rol debe estar en mayúsculas y contener entre 2 y 40 caracteres alfanuméricos o guiones bajos.'
      );
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 100) {
      return Result.fail('El nombre descriptivo del rol debe tener entre 2 y 100 caracteres.');
    }

    if (!Array.isArray(draft.permissions) || draft.permissions.length === 0) {
      return Result.fail('Selecciona al menos un permiso para el rol.');
    }

    return Result.ok({
      code,
      name,
      description: draft.description?.trim() || 'Rol operativo del sistema POS',
      permissions: Array.from(new Set(draft.permissions)),
      isActive: draft.isActive ?? true,
    });
  }

  public get raw(): Readonly<RbacRoleProps> {
    return this.props;
  }

  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string {
    return this.props.description;
  }

  public get permissions(): string[] {
    return this.props.permissions;
  }

  public get isWildcardSuperAdmin(): boolean {
    return (
      this.props.code.toUpperCase() === 'SUPER_ADMIN' ||
      this.props.permissions.includes('superAdmin:*')
    );
  }
}
