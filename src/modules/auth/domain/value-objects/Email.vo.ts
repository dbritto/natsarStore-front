import { Result } from '@shared/domain/Result';
import { ValueObject } from '@shared/domain/ValueObject';

interface EmailProps extends Record<string, unknown> {
  value: string;
}

/**
 * Value Object Email (DDD - Módulo Auth)
 * Garantiza que todo correo electrónico en el dominio esté normalizado y cumpla el formato RFC.
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  public get value(): string {
    return this.props.value;
  }

  public static create(rawEmail: string): Result<Email> {
    const trimmed = (rawEmail ?? '').trim().toLowerCase();
    if (!trimmed) {
      return Result.fail<Email>('El correo electrónico es obligatorio.');
    }
    if (!this.EMAIL_REGEX.test(trimmed)) {
      return Result.fail<Email>('Ingresa un correo electrónico corporativo válido.');
    }
    return Result.ok<Email>(new Email({ value: trimmed }));
  }
}
