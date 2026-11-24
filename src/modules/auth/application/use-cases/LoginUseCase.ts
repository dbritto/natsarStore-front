import { Result } from '@shared/domain/Result';
import { Email } from '../../domain/value-objects/Email.vo';
import { Password } from '../../domain/value-objects/Password.vo';
import { UserSession } from '../../domain/models/UserSession.model';
import { AuthRepositoryPort } from '../../domain/ports/AuthRepositoryPort';
import { SessionStoragePort } from '../../domain/ports/SessionStoragePort';

export interface LoginCommand {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Caso de Uso LoginUseCase (Capa de Aplicación - Arquitectura Hexagonal)
 * Orquesta validación de Value Objects, invocación del puerto de repositorio y persistencia de sesión.
 */
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly sessionStorage: SessionStoragePort
  ) {}

  public async execute(command: LoginCommand): Promise<Result<UserSession>> {
    const emailOrError = Email.create(command.email);
    if (emailOrError.isFailure) {
      return Result.fail<UserSession>(emailOrError.error!);
    }

    const passwordOrError = Password.create(command.password);
    if (passwordOrError.isFailure) {
      return Result.fail<UserSession>(passwordOrError.error!);
    }

    const email = emailOrError.getValue();
    const password = passwordOrError.getValue();

    const tokensResult = await this.authRepository.login(email, password);
    if (tokensResult.isFailure) {
      return Result.fail<UserSession>(tokensResult.error!);
    }

    const tokens = tokensResult.getValue();
    const session = UserSession.fromTokens(tokens, email.value);

    this.sessionStorage.saveSession(session);
    if (command.rememberMe) {
      this.sessionStorage.saveRememberedEmail(email.value);
    } else {
      this.sessionStorage.clearRememberedEmail();
    }

    return Result.ok<UserSession>(session);
  }
}
