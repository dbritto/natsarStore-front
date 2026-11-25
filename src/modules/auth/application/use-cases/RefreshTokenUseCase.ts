import { Result } from '@shared/domain/Result';
import { UserSession } from '../../domain/models/UserSession.model';
import { AuthRepositoryPort } from '../../domain/ports/AuthRepositoryPort';
import { SessionStoragePort } from '../../domain/ports/SessionStoragePort';

/**
 * Caso de Uso RefreshTokenUseCase (Capa de Aplicación - Módulo Auth)
 * Ejecuta la rotación de tokens contra `POST /api/v1/auth/refresh`.
 * Si el Refresh Token caducó o el servidor rechaza la renovación, invalida la sesión activa.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly sessionStorage: SessionStoragePort
  ) {}

  public async execute(currentSession?: UserSession | null): Promise<Result<UserSession>> {
    const activeSession = currentSession ?? this.sessionStorage.getSession();
    if (!activeSession) {
      this.sessionStorage.clearSession();
      return Result.fail('No hay una sesión activa para renovar.');
    }

    if (activeSession.tokens.isRefreshTokenExpired()) {
      this.sessionStorage.clearSession();
      return Result.fail('El tiempo máximo de renovación de tu sesión ha finalizado. Por favor inicia sesión de nuevo.');
    }

    const refreshResult = await this.authRepository.refreshToken(activeSession.tokens.refreshToken);
    if (refreshResult.isFailure) {
      return Result.fail(refreshResult.error ?? 'No fue posible renovar la sesión.');
    }

    const updatedSession = activeSession.withRefreshedTokens(refreshResult.getValue());
    this.sessionStorage.saveSession(updatedSession);
    return Result.ok(updatedSession);
  }
}
