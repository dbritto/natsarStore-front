import { Result } from '@shared/domain/Result';
import { Email } from '../value-objects/Email.vo';
import { Password } from '../value-objects/Password.vo';
import { AuthTokensModel } from '../models/AuthTokens.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal)
 * Define el contrato que cualquier adaptador de autenticación (HTTP API Factus o Mock) debe cumplir.
 */
export interface AuthRepositoryPort {
  login(email: Email, password: Password): Promise<Result<AuthTokensModel>>;
  refreshToken(refreshToken: string): Promise<Result<AuthTokensModel>>;
  logout(): Promise<Result<void>>;
}
