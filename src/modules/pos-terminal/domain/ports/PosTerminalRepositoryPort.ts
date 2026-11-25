import { Result } from '@shared/domain/Result';
import { CashShiftModel } from '../models/CashShift.model';
import {
  PosCartLineItem,
  PosPaymentLine,
  PosReceiptProps,
} from '../models/PosCart.model';
import { CustomerModel } from '@modules/customers/domain/models/Customer.model';

export interface EmitPosInvoiceCommand {
  customer: CustomerModel;
  lines: PosCartLineItem[];
  payments: PosPaymentLine[];
}

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para la Terminal Caja Registradora POS.
 */
export interface PosTerminalRepositoryPort {
  getCurrentShift(): Promise<Result<CashShiftModel>>;
  openShift(openingCashCop: number, cashierName: string): Promise<Result<CashShiftModel>>;
  closeShift(countedCashCop: number): Promise<Result<CashShiftModel>>;
  emitInvoice(command: EmitPosInvoiceCommand): Promise<Result<PosReceiptProps>>;
  listEmittedReceipts(): Promise<Result<PosReceiptProps[]>>;
}
