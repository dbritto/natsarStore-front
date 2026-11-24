import { ValueObject } from '@shared/domain/ValueObject';

interface MoneyCopProps extends Record<string, unknown> {
  amount: number;
}

/**
 * Value Object MoneyCop (DDD - Módulo POS Workspace)
 * Representa valores monetarios en Pesos Colombianos (COP) sin errores de coma flotante.
 */
export class MoneyCop extends ValueObject<MoneyCopProps> {
  private constructor(props: MoneyCopProps) {
    super(props);
  }

  public static fromNumber(value: number): MoneyCop {
    const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    return new MoneyCop({ amount: safe });
  }

  public get amount(): number {
    return this.props.amount;
  }

  public format(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(this.props.amount);
  }
}
