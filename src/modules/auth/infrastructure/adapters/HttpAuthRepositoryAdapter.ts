import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import { AuthRepositoryPort } from '../../domain/ports/AuthRepositoryPort';
import { Email } from '../../domain/value-objects/Email.vo';
import { Password } from '../../domain/value-objects/Password.vo';
import { AuthTokensDto, AuthTokensModel } from '../../domain/models/AuthTokens.model';

/**
 * Adaptador de Salida (Driven Adapter) HTTP para Autenticación de NatsarStore.
 * Se comunica con `/api/v1/auth/login`, `/api/v1/auth/refresh` y `/api/v1/auth/logout`.
 */
export class HttpAuthRepositoryAdapter implements AuthRepositoryPort {
  constructor(private readonly httpClient: HttpClientPort) {}

  public async login(email: Email, password: Password): Promise<Result<AuthTokensModel>> {
    try {
      const response = await this.httpClient.post<AuthTokensDto>('/api/v1/auth/login', {
        email: email.value,
        password: password.value,
      });

      if (response.success && response.data) {
        return Result.ok(
          new AuthTokensModel({
            ...response.data,
            connectionMode: 'LIVE_API',
          })
        );
      }

      return Result.fail(response.error ?? 'Credenciales inválidas.');
    } catch {
      return Result.fail('No fue posible conectar con el servidor de autenticación.');
    }
  }

  public async refreshToken(refreshToken: string): Promise<Result<AuthTokensModel>> {
    try {
      const response = await this.httpClient.post<AuthTokensDto>('/api/v1/auth/refresh', {
        refreshToken,
      });
      if (response.success && response.data) {
        return Result.ok(new AuthTokensModel({ ...response.data, connectionMode: 'LIVE_API' }));
      }
      return Result.fail(response.error ?? 'No fue posible renovar la sesión.');
    } catch {
      return Result.fail('Servidor de autenticación no disponible.');
    }
  }

  public async logout(): Promise<Result<void>> {
    try {
      await this.httpClient.post('/api/v1/auth/logout');
      return Result.ok();
    } catch {
      return Result.ok();
    }
  }
}
