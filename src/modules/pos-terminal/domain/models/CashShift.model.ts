import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export type CashShiftStatus = 'OPEN' | 'CLOSED';

export interface CashShiftProps {
  id: string;
  shiftCode: string;
  establishmentName: string;
  registerName: string;
  cashierName: string;
  status: CashShiftStatus;
  openingCashCop: number;
  cashSalesCop: number;
  cardSalesCop: number;
  transferSalesCop: number;
  ticketsCount: number;
  openedAt: string;
  closedAt: string | null;
  countedClosingCashCop: number | null;
}

/**
 * Entidad / Modelo Rico de Dominio CashShiftModel (DDD - Diseño en Modelos)
 * Gestiona el ciclo de vida del Turno de Caja POS: Apertura con base inicial,
 * acumulación por medios de pago y Arqueo de Cierre.
 */
export class CashShiftModel extends Entity<CashShiftProps> {
  constructor(props: CashShiftProps) {
    super(props, props.id);
  }

  public static validateOpeningCash(amount: number): Result<number> {
    if (!Number.isFinite(amount) || amount < 0) {
      return Result.fail('El saldo base inicial de apertura de caja debe ser mayor o igual a $0.');
    }
    return Result.ok(Math.round(amount));
  }

  public get raw(): Readonly<CashShiftProps> {
    return this.props;
  }

  public get isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  public get shiftCode(): string {
    return this.props.shiftCode;
  }

  /**
   * Efectivo físico esperado en gaveta = Base Inicial + Ventas en Efectivo.
   */
  public get expectedDrawerCashCop(): number {
    return Math.round(this.props.openingCashCop + this.props.cashSalesCop);
  }

  /**
   * Total vendido en el turno sumando todos los medios de pago.
   */
  public get totalShiftSalesCop(): number {
    return Math.round(
      this.props.cashSalesCop + this.props.cardSalesCop + this.props.transferSalesCop
    );
  }

  public calculateArqueoVariance(countedCashCop: number): number {
    return Math.round(countedCashCop - this.expectedDrawerCashCop);
  }

  public static formatCop(amount: number): string {
    return `$ ${Math.round(amount).toLocaleString('es-CO')}`;
  }
}
