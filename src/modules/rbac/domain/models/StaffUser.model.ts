import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface StaffUserProps {
  id: string;
  email: string;
  names: string;
  surnames: string;
  identificationTypeCode: string; // '13' CC, '22' CE, '41' PAS
  identificationNumber: string;
  roles: string[];
  permissions: string[];
  establishmentId: string;
  establishmentName: string;
  photoUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface SaveStaffUserDraft {
  email: string;
  password?: string;
  names: string;
  surnames: string;
  identificationTypeCode: string;
  identificationNumber: string;
  roles: string[];
  establishmentId: string;
  isActive?: boolean;
}

export interface ResetPasswordDraft {
  targetUserId: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Entidad / Modelo Rico de Dominio StaffUserModel (DDD - Diseño en Modelos)
 * Homologado con `User` del backend (`/api/v1/auth/users`), incluyendo reglas de protección
 * contra auto-eliminación, comodín `superAdmin:*`, foto de perfil y restablecimiento de clave.
 */
export class StaffUserModel extends Entity<StaffUserProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(props: StaffUserProps) {
    super(props, props.id);
  }

  public static validateDraft(
    draft: SaveStaffUserDraft,
    isCreating: boolean
  ): Result<SaveStaffUserDraft> {
    const email = (draft.email ?? '').trim().toLowerCase();
    if (!this.EMAIL_REGEX.test(email)) {
      return Result.fail('Ingresa un correo electrónico corporativo válido.');
    }

    if (isCreating) {
      if (!draft.password || draft.password.length < 8) {
        return Result.fail('La contraseña inicial debe tener al menos 8 caracteres.');
      }
    }

    const names = (draft.names ?? '').trim();
    const surnames = (draft.surnames ?? '').trim();
    if (names.length < 2 || surnames.length < 2) {
      return Result.fail('Ingresa los nombres y apellidos completos del colaborador.');
    }

    const idNum = (draft.identificationNumber ?? '').trim();
    if (idNum.length < 5 || idNum.length > 20) {
      return Result.fail('El número de documento de identidad debe tener entre 5 y 20 caracteres.');
    }

    if (!Array.isArray(draft.roles) || draft.roles.length === 0) {
      return Result.fail('Asigna al menos un rol RBAC al colaborador.');
    }

    return Result.ok({
      ...draft,
      email,
      names,
      surnames,
      identificationNumber: idNum,
      establishmentId: draft.establishmentId || 'b0000000-0000-4000-8000-000000000001',
      isActive: draft.isActive ?? true,
    });
  }

  public static validatePasswordReset(draft: ResetPasswordDraft): Result<ResetPasswordDraft> {
    if (!draft.newPassword || draft.newPassword.length < 8) {
      return Result.fail('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (draft.newPassword !== draft.confirmPassword) {
      return Result.fail('La nueva contraseña y su confirmación no coinciden.');
    }
    return Result.ok(draft);
  }

  public get raw(): Readonly<StaffUserProps> {
    return this.props;
  }

  public get fullName(): string {
    return `${this.props.names} ${this.props.surnames}`.trim();
  }

  public get initials(): string {
    const n = this.props.names[0] ?? 'N';
    const s = this.props.surnames[0] ?? 'S';
    return `${n}${s}`.toUpperCase();
  }

  public get email(): string {
    return this.props.email;
  }

  public get roles(): string[] {
    return this.props.roles;
  }

  public get isSuperAdmin(): boolean {
    return (
      this.props.roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN') ||
      this.props.permissions.includes('superAdmin:*')
    );
  }

  public get primaryRoleLabel(): string {
    const primary = this.props.roles[0]?.toUpperCase() ?? 'CASHIER';
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin (*)',
      ADMIN: 'Administrador POS',
      STORE_SUPERVISOR: 'Supervisor Tienda',
      CASHIER: 'Cajero POS',
      BILLING_CLERK: 'Facturador DIAN',
      INVENTORY_MANAGER: 'Gestor Inventario',
      ACCOUNTANT: 'Contador Fiscal',
    };
    return map[primary] ?? primary;
  }

  public canBeDeletedBy(currentUserId: string): boolean {
    if (this.id === currentUserId) return false;
    if (this.isSuperAdmin && this.id === 'e0000000-0000-4000-8000-000000000001') return false;
    return true;
  }
}
