import { AuthTokensDto, AuthTokensModel } from '../../domain/models/AuthTokens.model';
import { UserProfileOverrides, UserSession } from '../../domain/models/UserSession.model';
import { SessionStoragePort } from '../../domain/ports/SessionStoragePort';

const SESSION_KEY = 'factus_pos_active_session_v1';
const REMEMBER_EMAIL_KEY = 'factus_pos_remembered_email_v1';

interface StoredSessionPayload {
  email: string;
  tokens: AuthTokensDto;
  profileOverrides?: UserProfileOverrides;
}

/**
 * Adaptador de Salida (Driven Adapter) para persistencia de sesión en LocalStorage.
 * Conserva las marcas de tiempo exactas de expiración del token para que recargar la página
 * no reinicie el temporizador y descarta sesiones cuyo tiempo haya caducado.
 */
export class LocalStorageSessionAdapter implements SessionStoragePort {
  public saveSession(session: UserSession): void {
    try {
      const payload: StoredSessionPayload = {
        email: session.email,
        tokens: {
          accessToken: session.tokens.accessToken,
          refreshToken: session.tokens.refreshToken,
          expiresIn: session.tokens.expiresIn,
          refreshExpiresIn: session.tokens.refreshExpiresIn,
          tokenType: session.tokens.tokenType,
          connectionMode: session.tokens.connectionMode,
          issuedAtMs: session.tokens.issuedAtMs,
          accessExpiresAtMs: session.tokens.accessExpiresAtMs,
          refreshExpiresAtMs: session.tokens.refreshExpiresAtMs,
        },
        profileOverrides: session.getProfileOverrides(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
      // Ignorar errores de cuota de almacenamiento
    }
  }

  public getSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSessionPayload;
      if (!parsed?.tokens?.accessToken) return null;
      const tokensModel = new AuthTokensModel(parsed.tokens);
      const session = UserSession.fromTokens(tokensModel, parsed.email, parsed.profileOverrides);
      if (session.isExpired()) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignorar
    }
  }

  public saveRememberedEmail(email: string): void {
    try {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } catch {
      // Ignorar
    }
  }

  public getRememberedEmail(): string | null {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY);
    } catch {
      return null;
    }
  }

  public clearRememberedEmail(): void {
    try {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch {
      // Ignorar
    }
  }
}
