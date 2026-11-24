import { UserSession } from '../../domain/models/UserSession.model';
import { SessionStoragePort } from '../../domain/ports/SessionStoragePort';

/**
 * Caso de Uso RestoreSessionUseCase (Capa de Aplicación)
 * Hidrata la entidad de dominio UserSession al iniciar la aplicación.
 */
export class RestoreSessionUseCase {
  constructor(private readonly sessionStorage: SessionStoragePort) {}

  public execute(): { session: UserSession | null; rememberedEmail: string } {
    return {
      session: this.sessionStorage.getSession(),
      rememberedEmail: this.sessionStorage.getRememberedEmail() ?? '',
    };
  }
}
