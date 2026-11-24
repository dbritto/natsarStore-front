import { UserSession } from '../models/UserSession.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal)
 * Contrato para almacenamiento y recuperación de la sesión activa y recordatorio de correo.
 */
export interface SessionStoragePort {
  saveSession(session: UserSession): void;
  getSession(): UserSession | null;
  clearSession(): void;
  saveRememberedEmail(email: string): void;
  getRememberedEmail(): string | null;
  clearRememberedEmail(): void;
}
