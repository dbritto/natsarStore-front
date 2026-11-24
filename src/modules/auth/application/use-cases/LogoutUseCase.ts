import { AuthRepositoryPort } from '../../domain/ports/AuthRepositoryPort';
import { SessionStoragePort } from '../../domain/ports/SessionStoragePort';

/**
 * Caso de Uso LogoutUseCase (Capa de Aplicación)
 * Cierra la sesión en el backend y limpia el almacenamiento local.
 */
export class LogoutUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly sessionStorage: SessionStoragePort
  ) {}

  public async execute(): Promise<void> {
    await this.authRepository.logout().catch(() => undefined);
    this.sessionStorage.clearSession();
  }
}
