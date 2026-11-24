import { Entity } from '@shared/domain/Entity';
import { AuthTokensModel } from './AuthTokens.model';

export interface UserSessionProps {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  tokens: AuthTokensModel;
  authenticatedAt: string;
}

/**
 * Entidad / Modelo Rico de Dominio UserSession (DDD + Diseño en Modelos)
 * Implementa la lógica de negocio RBAC del sistema POS y comodín dinámico `superAdmin:*`.
 */
export class UserSession extends Entity<UserSessionProps> {
  private constructor(props: UserSessionProps) {
    super(props, props.userId);
  }

  public static fromTokens(tokens: AuthTokensModel, fallbackEmail?: string): UserSession {
    const claims = tokens.extractClaims(fallbackEmail);
    return new UserSession({
      userId: claims.userId,
      email: claims.email,
      fullName: claims.fullName,
      roles: claims.roles,
      permissions: claims.permissions,
      tokens,
      authenticatedAt: new Date().toISOString(),
    });
  }

  public get email(): string {
    return this.props.email;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get roles(): string[] {
    return this.props.roles;
  }

  public get permissions(): string[] {
    return this.props.permissions;
  }

  public get tokens(): AuthTokensModel {
    return this.props.tokens;
  }

  public get connectionMode(): 'LIVE_API' | 'SANDBOX_OFFLINE' {
    return this.props.tokens.connectionMode;
  }

  /**
   * Regla de Dominio: El rol SUPER_ADMIN o el comodín `superAdmin:*` otorgan acceso total.
   */
  public get isSuperAdmin(): boolean {
    return (
      this.props.roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN') ||
      this.props.permissions.includes('superAdmin:*')
    );
  }

  public hasPermission(requiredPermission: string): boolean {
    if (this.isSuperAdmin) return true;
    return this.props.permissions.includes(requiredPermission);
  }

  public get primaryRoleLabel(): string {
    const primary = this.props.roles[0]?.toUpperCase() ?? 'CASHIER';
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin POS',
      ADMIN: 'Administrador de Tienda',
      STORE_SUPERVISOR: 'Supervisor POS',
      CASHIER: 'Cajero Punto de Venta',
      BILLING_CLERK: 'Facturador DIAN',
      INVENTORY_MANAGER: 'Gestor de Inventario',
      ACCOUNTANT: 'Contador Tributario',
    };
    return roleLabels[primary] ?? primary;
  }
}
