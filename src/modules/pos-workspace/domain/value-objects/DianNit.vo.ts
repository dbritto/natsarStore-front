import { Result } from '@shared/domain/Result';
import { ValueObject } from '@shared/domain/ValueObject';

interface DianNitProps extends Record<string, unknown> {
  digits: string;
  verificationDigit: number;
  isFinalConsumer: boolean;
}

/**
 * Value Object DianNit (DDD - Módulo POS Workspace)
 * Calcula automáticamente el Dígito de Verificación (DV) oficial de la DIAN (Módulo 11)
 * y reconoce el documento estándar `222222222222` (CONSUMIDOR FINAL).
 */
export class DianNit extends ValueObject<DianNitProps> {
  private static readonly DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

  private constructor(props: DianNitProps) {
    super(props);
  }

  public static calculateVerificationDigit(nitDigits: string): number {
    const clean = nitDigits.replace(/\D/g, '');
    let sum = 0;
    const len = clean.length;

    for (let i = 0; i < len && i < this.DIAN_WEIGHTS.length; i++) {
      const digit = parseInt(clean[len - 1 - i], 10);
      sum += digit * this.DIAN_WEIGHTS[i];
    }

    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : remainder;
  }

  public static create(rawInput: string): Result<DianNit> {
    const clean = (rawInput ?? '').replace(/\D/g, '');
    if (clean.length < 5 || clean.length > 15) {
      return Result.fail<DianNit>('El NIT o documento DIAN debe tener entre 5 y 15 dígitos.');
    }

    const isFinalConsumer = clean === '222222222222';
    const dv = this.calculateVerificationDigit(clean);

    return Result.ok<DianNit>(
      new DianNit({
        digits: clean,
        verificationDigit: dv,
        isFinalConsumer,
      })
    );
  }

  public get digits(): string {
    return this.props.digits;
  }

  public get verificationDigit(): number {
    return this.props.verificationDigit;
  }

  public get isFinalConsumer(): boolean {
    return this.props.isFinalConsumer;
  }

  public get formatted(): string {
    if (this.isFinalConsumer) {
      return '222222222222 (Consumidor Final DIAN)';
    }
    return `${this.props.digits}-${this.props.verificationDigit}`;
  }
}
