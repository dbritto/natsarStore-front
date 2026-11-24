import { Result } from '@shared/domain/Result';
import { ValueObject } from '@shared/domain/ValueObject';

interface PasswordProps extends Record<string, unknown> {
  value: string;
}

/**
 * Value Object Password (DDD - Módulo Auth)
 * Valida las invariantes de seguridad antes de despachar el comando de autenticación.
 */
export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  public get value(): string {
    return this.props.value;
  }

  public static create(rawPassword: string): Result<Password> {
    if (!rawPassword || rawPassword.trim().length === 0) {
      return Result.fail<Password>('La contraseña es obligatoria.');
    }
    if (rawPassword.length < 6) {
      return Result.fail<Password>('La contraseña debe contener al menos 6 caracteres.');
    }
    return Result.ok<Password>(new Password({ value: rawPassword }));
  }
}
