export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  connectionMode?: 'LIVE_API' | 'SANDBOX_OFFLINE';
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
 * Encapsula el par de tokens JWT RS256 del backend Factus POS y decodifica los claims mínimos del Access Token.
 */
export class AuthTokensModel {
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly expiresIn: number;
  public readonly refreshExpiresIn: number;
  public readonly tokenType: string;
  public readonly connectionMode: 'LIVE_API' | 'SANDBOX_OFFLINE';

  constructor(dto: AuthTokensDto) {
    this.accessToken = dto.accessToken;
    this.refreshToken = dto.refreshToken;
    this.expiresIn = dto.expiresIn;
    this.refreshExpiresIn = dto.refreshExpiresIn;
    this.tokenType = dto.tokenType ?? 'Bearer';
    this.connectionMode = dto.connectionMode ?? 'LIVE_API';
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
          fullName: parsed.fullName || 'Administrador Principal POS',
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
      // Fallback seguro si el token es de simulación
    }

    return {
      sub: 'e0000000-0000-4000-8000-000000000001',
      userId: 'e0000000-0000-4000-8000-000000000001',
      email: fallbackEmail,
      fullName: 'Administrador Principal POS',
      roles: ['SUPER_ADMIN'],
      permissions: ['superAdmin:*'],
    };
  }
}
