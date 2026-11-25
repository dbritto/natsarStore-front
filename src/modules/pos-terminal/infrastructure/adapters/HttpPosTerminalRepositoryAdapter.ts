import { Result } from '@shared/domain/Result';
import { InventoryRepositoryPort } from '@modules/inventory/domain/ports/InventoryRepositoryPort';
import {
  CashShiftModel,
  CashShiftProps,
} from '../../domain/models/CashShift.model';
import {
  PosCartModel,
  PosReceiptProps,
} from '../../domain/models/PosCart.model';
import {
  EmitPosInvoiceCommand,
  PosTerminalRepositoryPort,
} from '../../domain/ports/PosTerminalRepositoryPort';

const INITIAL_SHIFT: CashShiftProps = {
  id: 'shift-2026-001',
  shiftCode: 'TUR-CAJA-01',
  establishmentName: 'Punto de Venta Central Mostrador',
  registerName: 'Terminal TPV Principal #01',
  cashierName: 'Administrador Principal POS',
  status: 'OPEN',
  openingCashCop: 300000,
  cashSalesCop: 423500,
  cardSalesCop: 570000,
  transferSalesCop: 190000,
  ticketsCount: 14,
  openedAt: '2026-11-24T08:00:00.000Z',
  closedAt: null,
  countedClosingCashCop: null,
};

/**
 * Adaptador de Salida (Driven Adapter) para la Terminal Caja Registradora POS.
 * Emite comprobantes electrónicos DIAN con CUFE/QR, actualiza los acumulados del turno de caja
 * y descuenta automáticamente las existencias en el Kárdex de la Bodega Mostrador POS.
 */
export class HttpPosTerminalRepositoryAdapter implements PosTerminalRepositoryPort {
  private currentShift: CashShiftProps = { ...INITIAL_SHIFT };
  private consecutiveNumber = 990001043;
  private emittedReceipts: PosReceiptProps[] = [];

  constructor(private readonly inventoryRepository?: InventoryRepositoryPort) {}

  public async getCurrentShift(): Promise<Result<CashShiftModel>> {
    return Result.ok(new CashShiftModel(this.currentShift));
  }

  public async openShift(
    openingCashCop: number,
    cashierName: string
  ): Promise<Result<CashShiftModel>> {
    this.currentShift = {
      id: `shift-${Date.now()}`,
      shiftCode: `TUR-CAJA-${Math.floor(10 + Math.random() * 89)}`,
      establishmentName: 'Punto de Venta Central Mostrador',
      registerName: 'Terminal TPV Principal #01',
      cashierName: cashierName || 'Cajero POS',
      status: 'OPEN',
      openingCashCop,
      cashSalesCop: 0,
      cardSalesCop: 0,
      transferSalesCop: 0,
      ticketsCount: 0,
      openedAt: new Date().toISOString(),
      closedAt: null,
      countedClosingCashCop: null,
    };

    return Result.ok(new CashShiftModel(this.currentShift));
  }

  public async closeShift(countedCashCop: number): Promise<Result<CashShiftModel>> {
    this.currentShift = {
      ...this.currentShift,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      countedClosingCashCop: countedCashCop,
    };
    return Result.ok(new CashShiftModel(this.currentShift));
  }

  public async emitInvoice(
    command: EmitPosInvoiceCommand
  ): Promise<Result<PosReceiptProps>> {
    const liquidation = PosCartModel.calculateLiquidation(
      command.customer,
      command.lines
    );
    const netPayable = liquidation.result.netPayable;
    const invoiceNumber = `SETP-${this.consecutiveNumber++}`;
    const cufe = PosCartModel.generateCufeHash(invoiceNumber, netPayable);

    const amountFor = (method: 'CASH' | 'CARD' | 'TRANSFER_BRE_B') =>
      command.payments
        .filter((p) => p.method === method)
        .reduce((acc, p) => acc + p.amountCop, 0);
    const cashLine = command.payments.find((p) => p.method === 'CASH');
    const cashApplied = amountFor('CASH');
    const cashTendered = cashLine ? (cashLine.tenderedCop ?? cashApplied) : 0;
    const changeDue = cashLine ? Math.max(0, cashTendered - cashApplied) : 0;
    const receiptMethod = PosCartModel.resolveReceiptPaymentMethod(command.payments);

    // Descontar existencias automáticamente en la Bodega Mostrador Principal (Kárdex POS_SALE)
    if (this.inventoryRepository) {
      for (const line of command.lines) {
        await this.inventoryRepository
          .registerMovement({
            warehouseId: 'wh-pos-central-01',
            catalogItemId: line.catalogItemId,
            reasonCode: 'POS_SALE',
            quantity: line.quantity,
            referenceCode: invoiceNumber,
            notes: `Venta POS a ${command.customer.names}`,
          })
          .catch(() => undefined);
      }
    }

    // Actualizar acumulados del turno de caja activo
    this.currentShift = {
      ...this.currentShift,
      ticketsCount: this.currentShift.ticketsCount + 1,
      cashSalesCop: this.currentShift.cashSalesCop + cashApplied,
      cardSalesCop: this.currentShift.cardSalesCop + amountFor('CARD'),
      transferSalesCop: this.currentShift.transferSalesCop + amountFor('TRANSFER_BRE_B'),
    };

    const receipt: PosReceiptProps = {
      id: `fev-${Date.now()}`,
      invoiceNumber,
      prefix: 'SETP',
      resolutionNumber: '18760000001 (Rango 990000000 - 995000000)',
      cufe,
      qrVerificationUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`,
      issuedAt: new Date().toISOString(),
      customerName: command.customer.names,
      customerIdentification: command.customer.identificationFormatted,
      paymentMethod: receiptMethod,
      paymentMethodLabel: PosCartModel.getReceiptPaymentLabel(command.payments),
      payments: command.payments.map((p) => ({ ...p })),
      lines: [...command.lines],
      taxSummary: liquidation.result,
      cashTenderedCop: cashTendered,
      changeDueCop: changeDue,
    };

    this.emittedReceipts = [receipt, ...this.emittedReceipts];
    return Result.ok(receipt);
  }

  public async listEmittedReceipts(): Promise<Result<PosReceiptProps[]>> {
    return Result.ok(this.emittedReceipts);
  }
}
