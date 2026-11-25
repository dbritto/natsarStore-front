import { Entity } from '@shared/domain/Entity';
import { AuthTokensModel } from './AuthTokens.model';

export interface UserProfileOverrides {
  fullName?: string;
  names?: string;
  surnames?: string;
  email?: string;
  identificationTypeCode?: string;
  identificationNumber?: string;
  establishmentId?: string;
  establishmentName?: string;
  photoUrl?: string | null;
}

export interface UserSessionProps {
  userId: string;
  email: string;
  fullName: string;
  names: string;
  surnames: string;
  identificationTypeCode: string;
  identificationNumber: string;
  establishmentId: string;
  establishmentName: string;
  photoUrl: string | null;
  roles: string[];
  permissions: string[];
  tokens: AuthTokensModel;
  authenticatedAt: string;
}

/**
 * Entidad / Modelo Rico de Dominio UserSession (DDD + Diseño en Modelos)
 * Implementa la lógica de negocio RBAC del sistema POS, comodín dinámico `superAdmin:*`,
 * control de vigencia temporal de tokens y datos completos del perfil del colaborador.
 */
export class UserSession extends Entity<UserSessionProps> {
  private constructor(props: UserSessionProps) {
    super(props, props.userId);
  }

  public static fromTokens(
    tokens: AuthTokensModel,
    fallbackEmail?: string,
    overrides?: UserProfileOverrides
  ): UserSession {
    const claims = tokens.extractClaims(fallbackEmail);
    const rawFullName = overrides?.fullName || claims.fullName || 'Administrador Principal del Sistema POS';
    const nameParts = rawFullName.trim().split(/\s+/);
    const defaultNames = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ') || 'Administrador Principal';
    const defaultSurnames = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ') || 'del Sistema POS';

    const names = overrides?.names ?? defaultNames;
    const surnames = overrides?.surnames ?? defaultSurnames;
    const fullName = overrides?.fullName ?? `${names} ${surnames}`.trim();

    return new UserSession({
      userId: claims.userId,
      email: overrides?.email ?? claims.email,
      fullName,
      names,
      surnames,
      identificationTypeCode: overrides?.identificationTypeCode ?? '13',
      identificationNumber: overrides?.identificationNumber ?? '1020304050',
      establishmentId: overrides?.establishmentId ?? 'b0000000-0000-4000-8000-000000000001',
      establishmentName: overrides?.establishmentName ?? 'Sede Principal NatsarStore - Bogotá',
      photoUrl: overrides?.photoUrl ?? null,
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

  public get names(): string {
    return this.props.names;
  }

  public get surnames(): string {
    return this.props.surnames;
  }

  public get identificationTypeCode(): string {
    return this.props.identificationTypeCode;
  }

  public get identificationNumber(): string {
    return this.props.identificationNumber;
  }

  public get establishmentId(): string {
    return this.props.establishmentId;
  }

  public get establishmentName(): string {
    return this.props.establishmentName;
  }

  public get photoUrl(): string | null {
    return this.props.photoUrl;
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

  public get authenticatedAt(): string {
    return this.props.authenticatedAt;
  }

  public get connectionMode(): 'LIVE_API' | 'SANDBOX_OFFLINE' {
    return this.props.tokens.connectionMode;
  }

  public isExpired(nowMs = Date.now()): boolean {
    return this.props.tokens.isAccessTokenExpired(nowMs);
  }

  public getRemainingSeconds(nowMs = Date.now()): number {
    return this.props.tokens.getRemainingAccessSeconds(nowMs);
  }

  public shouldRefreshSoon(nowMs = Date.now(), thresholdSeconds = 45): boolean {
    return this.props.tokens.shouldRefreshSoon(nowMs, thresholdSeconds);
  }

  public getProfileOverrides(): UserProfileOverrides {
    return {
      fullName: this.props.fullName,
      names: this.props.names,
      surnames: this.props.surnames,
      email: this.props.email,
      identificationTypeCode: this.props.identificationTypeCode,
      identificationNumber: this.props.identificationNumber,
      establishmentId: this.props.establishmentId,
      establishmentName: this.props.establishmentName,
      photoUrl: this.props.photoUrl,
    };
  }

  public withRefreshedTokens(newTokens: AuthTokensModel): UserSession {
    return UserSession.fromTokens(newTokens, this.props.email, this.getProfileOverrides());
  }

  public withUpdatedProfile(updates: Partial<UserProfileOverrides>): UserSession {
    const names = updates.names ?? this.props.names;
    const surnames = updates.surnames ?? this.props.surnames;
    const fullName = updates.fullName ?? `${names} ${surnames}`.trim();
    return new UserSession({
      ...this.props,
      names,
      surnames,
      fullName,
      email: updates.email ?? this.props.email,
      identificationTypeCode: updates.identificationTypeCode ?? this.props.identificationTypeCode,
      identificationNumber: updates.identificationNumber ?? this.props.identificationNumber,
      establishmentId: updates.establishmentId ?? this.props.establishmentId,
      establishmentName: updates.establishmentName ?? this.props.establishmentName,
      photoUrl: updates.photoUrl !== undefined ? updates.photoUrl : this.props.photoUrl,
    });
  }

  /**
   * Permite simular que el token está a pocos segundos de expirar para pruebas inmediatas.
   */
  public withForcedRemainingSeconds(seconds: number): UserSession {
    const now = Date.now();
    const expiredOrSoonTokens = new AuthTokensModel({
      accessToken: this.props.tokens.accessToken,
      refreshToken: this.props.tokens.refreshToken,
      expiresIn: seconds,
      refreshExpiresIn: this.props.tokens.refreshExpiresIn,
      tokenType: this.props.tokens.tokenType,
      connectionMode: this.props.tokens.connectionMode,
      issuedAtMs: this.props.tokens.issuedAtMs,
      accessExpiresAtMs: now + seconds * 1000,
      refreshExpiresAtMs: this.props.tokens.refreshExpiresAtMs,
    });
    return new UserSession({
      ...this.props,
      tokens: expiredOrSoonTokens,
    });
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
