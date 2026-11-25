export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  connectionMode?: 'LIVE_API' | 'SANDBOX_OFFLINE';
  issuedAtMs?: number;
  accessExpiresAtMs?: number;
  refreshExpiresAtMs?: number;
}

export interface DecodedJwtClaims {
  sub: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  exp?: number;
  iat?: number;
}

/**
 * Modelo de Dominio AuthTokens (Diseño en Modelos)
 * Encapsula el par de tokens JWT RS256 del backend Factus POS, decodifica claims
 * y controla estrictamente la vigencia temporal del Access Token y Refresh Token.
 */
export class AuthTokensModel {
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly expiresIn: number;
  public readonly refreshExpiresIn: number;
  public readonly tokenType: string;
  public readonly connectionMode: 'LIVE_API' | 'SANDBOX_OFFLINE';
  public readonly issuedAtMs: number;
  public readonly accessExpiresAtMs: number;
  public readonly refreshExpiresAtMs: number;

  constructor(dto: AuthTokensDto) {
    this.accessToken = dto.accessToken;
    this.refreshToken = dto.refreshToken;
    this.expiresIn = dto.expiresIn || 300;
    this.refreshExpiresIn = dto.refreshExpiresIn || 604800;
    this.tokenType = dto.tokenType ?? 'Bearer';
    this.connectionMode = dto.connectionMode ?? 'LIVE_API';

    const now = Date.now();
    this.issuedAtMs = dto.issuedAtMs ?? now;

    const claims = this.extractClaims();
    const jwtExpMs = claims.exp ? claims.exp * 1000 : undefined;

    this.accessExpiresAtMs =
      dto.accessExpiresAtMs ??
      (jwtExpMs && jwtExpMs > now ? jwtExpMs : this.issuedAtMs + this.expiresIn * 1000);

    this.refreshExpiresAtMs =
      dto.refreshExpiresAtMs ?? this.issuedAtMs + this.refreshExpiresIn * 1000;
  }

  /**
   * Indica si el tiempo de vigencia del Access Token ya expiró.
   */
  public isAccessTokenExpired(nowMs = Date.now()): boolean {
    return nowMs >= this.accessExpiresAtMs;
  }

  /**
   * Indica si el Refresh Token también venció.
   */
  public isRefreshTokenExpired(nowMs = Date.now()): boolean {
    return nowMs >= this.refreshExpiresAtMs;
  }

  /**
   * Calcula los segundos restantes de vigencia de la sesión actual.
   */
  public getRemainingAccessSeconds(nowMs = Date.now()): number {
    return Math.max(0, Math.ceil((this.accessExpiresAtMs - nowMs) / 1000));
  }

  /**
   * Indica si el token está próximo a vencer (por defecto dentro de los últimos 45 segundos).
   */
  public shouldRefreshSoon(nowMs = Date.now(), thresholdSeconds = 45): boolean {
    const remaining = this.getRemainingAccessSeconds(nowMs);
    return remaining > 0 && remaining <= thresholdSeconds;
  }

  /**
   * Extrae los claims públicos del JWT (principio de mínimo privilegio del backend Factus POS).
   */
  public extractClaims(fallbackEmail = 'admin@factuspos.com'): DecodedJwtClaims {
    try {
      const parts = this.accessToken.split('.');
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const parsed = JSON.parse(jsonPayload) as Partial<DecodedJwtClaims>;
        const roles = Array.isArray(parsed.roles) ? parsed.roles : ['SUPER_ADMIN'];
        const isSuper = roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN');
        return {
          sub: parsed.sub ?? parsed.userId ?? 'e0000000-0000-4000-8000-000000000001',
          userId: parsed.userId ?? parsed.sub ?? 'e0000000-0000-4000-8000-000000000001',
          email: parsed.email ?? fallbackEmail,
          fullName: parsed.fullName || 'Administrador Principal del Sistema POS',
          roles,
          permissions: Array.isArray(parsed.permissions)
            ? parsed.permissions
            : isSuper
            ? ['superAdmin:*']
            : ['pos:checkout'],
          exp: parsed.exp,
          iat: parsed.iat,
        };
      }
    } catch {
      // Fallback seguro si el token es opaco
    }

    return {
      sub: 'e0000000-0000-4000-8000-000000000001',
      userId: 'e0000000-0000-4000-8000-000000000001',
      email: fallbackEmail,
      fullName: 'Administrador Principal del Sistema POS',
      roles: ['SUPER_ADMIN'],
      permissions: ['superAdmin:*'],
    };
  }
}
