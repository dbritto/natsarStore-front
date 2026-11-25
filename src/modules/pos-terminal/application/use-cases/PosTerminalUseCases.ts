import { Result } from '@shared/domain/Result';
import { CashShiftModel } from '../../domain/models/CashShift.model';
import {
  PosCartModel,
  PosReceiptProps,
} from '../../domain/models/PosCart.model';
import {
  EmitPosInvoiceCommand,
  PosTerminalRepositoryPort,
} from '../../domain/ports/PosTerminalRepositoryPort';

/**
 * Casos de Uso de la Terminal Caja Registradora POS (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class PosTerminalUseCases {
  constructor(private readonly repository: PosTerminalRepositoryPort) {}

  public async getShift(): Promise<Result<CashShiftModel>> {
    return this.repository.getCurrentShift();
  }

  public async openCashShift(
    openingCashCop: number,
    cashierName: string
  ): Promise<Result<CashShiftModel>> {
    const validOrErr = CashShiftModel.validateOpeningCash(openingCashCop);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.openShift(validOrErr.getValue(), cashierName);
  }

  public async closeCashShift(countedCashCop: number): Promise<Result<CashShiftModel>> {
    if (!Number.isFinite(countedCashCop) || countedCashCop < 0) {
      return Result.fail('Ingresa el valor en efectivo físico contado durante el arqueo de caja.');
    }
    return this.repository.closeShift(Math.round(countedCashCop));
  }

  public async checkoutAndEmitInvoice(
    isShiftOpen: boolean,
    command: EmitPosInvoiceCommand
  ): Promise<Result<PosReceiptProps>> {
    const liquidation = PosCartModel.calculateLiquidation(command.customer, command.lines);
    const validOrErr = PosCartModel.validateCheckout({
      isShiftOpen,
      lines: command.lines,
      paymentMethod: command.paymentMethod,
      netPayableCop: liquidation.result.netPayable,
      cashTenderedCop: command.cashTenderedCop,
    });

    if (validOrErr.isFailure) {
      return Result.fail(validOrErr.error!);
    }

    return this.repository.emitInvoice(command);
  }

  public async getRecentReceipts(): Promise<Result<PosReceiptProps[]>> {
    return this.repository.listEmittedReceipts();
  }
}
