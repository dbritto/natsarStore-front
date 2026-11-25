import { Result } from '@shared/domain/Result';
import { CustomerModel } from '@modules/customers/domain/models/Customer.model';
import {
  TaxCalculationResultDto,
  TaxLiquidationModel,
} from '@modules/customers/domain/models/TaxLiquidation.model';

export type PosPaymentMethod = 'CASH' | 'CARD' | 'TRANSFER_BRE_B';
export type PosReceiptPaymentMethod = PosPaymentMethod | 'SPLIT';

/**
 * Value Object de dominio: una porción del pago de una factura (pagos divididos).
 * `amountCop` es el valor abonado a la factura; `tenderedCop` solo aplica a efectivo (billete recibido).
 */
export interface PosPaymentLine {
  method: PosPaymentMethod;
  amountCop: number;
  tenderedCop?: number;
}

export interface PosCartLineItem {
  catalogItemId: string;
  codeReference: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  tributeCode: '01' | '04' | 'ZZ';
  taxRate: number;
  imageUrl?: string | null;
}

export interface PosReceiptProps {
  id: string;
  invoiceNumber: string;
  prefix: string;
  resolutionNumber: string;
  cufe: string;
  qrVerificationUrl: string;
  issuedAt: string;
  customerName: string;
  customerIdentification: string;
  paymentMethod: PosReceiptPaymentMethod;
  paymentMethodLabel: string;
  payments: PosPaymentLine[];
  lines: PosCartLineItem[];
  taxSummary: TaxCalculationResultDto;
  cashTenderedCop: number;
  changeDueCop: number;
}

/**
 * Agregado de Dominio PosCartModel & PosReceiptModel (DDD - Diseño en Modelos)
 * Orquesta el carrito de compra del Punto de Venta, calcula en tiempo real impuestos y retenciones
 * según el adquirente seleccionado y genera el comprobante electrónico con CUFE y QR DIAN.
 */
export class PosCartModel {
  public static calculateLiquidation(
    customer: CustomerModel,
    lines: PosCartLineItem[]
  ): TaxLiquidationModel {
    const inputs = lines.map((line) => {
      const gross = line.quantity * line.unitPrice;
      const discountAmount = Math.round((gross * (line.discountPct || 0)) / 100);
      return {
        codeReference: line.codeReference,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountAmount,
        isTaxExcluded: line.tributeCode === 'ZZ' || line.taxRate <= 0,
        taxRate: line.tributeCode === 'ZZ' ? 0 : line.taxRate,
        tributeCode: line.tributeCode === 'ZZ' ? '01' : line.tributeCode,
      };
    });

    return TaxLiquidationModel.calculateForCustomer(customer, inputs);
  }

  /**
   * Regla de dominio de pagos divididos: la suma de las porciones debe cubrir exactamente el neto
   * a cobrar y el efectivo recibido no puede ser menor al valor asignado a efectivo.
   */
  public static validatePayments(
    payments: PosPaymentLine[],
    netPayableCop: number
  ): Result<PosPaymentLine[]> {
    const normalized = payments
      .map((p) => ({ ...p, amountCop: Math.round(p.amountCop) }))
      .filter((p) => p.amountCop > 0);

    if (normalized.length === 0) {
      return Result.fail('Indica cómo va a pagar el cliente antes de cobrar.');
    }

    const methods = new Set(normalized.map((p) => p.method));
    if (methods.size !== normalized.length) {
      return Result.fail('Cada medio de pago solo puede usarse una vez en el mismo cobro.');
    }

    const assigned = normalized.reduce((acc, p) => acc + p.amountCop, 0);
    if (assigned !== Math.round(netPayableCop)) {
      const diff = Math.round(netPayableCop) - assigned;
      return Result.fail(
        diff > 0
          ? `Faltan $ ${diff.toLocaleString('es-CO')} por asignar para completar el pago.`
          : `Los medios de pago superan el total en $ ${Math.abs(diff).toLocaleString('es-CO')}.`
      );
    }

    const cash = normalized.find((p) => p.method === 'CASH');
    if (cash && (cash.tenderedCop ?? cash.amountCop) < cash.amountCop) {
      return Result.fail(
        `El efectivo recibido ($ ${(cash.tenderedCop ?? 0).toLocaleString('es-CO')}) es menor al valor asignado a efectivo ($ ${cash.amountCop.toLocaleString('es-CO')}).`
      );
    }

    return Result.ok(
      normalized.map((p) =>
        p.method === 'CASH' ? { ...p, tenderedCop: p.tenderedCop ?? p.amountCop } : p
      )
    );
  }

  public static validateCheckout(params: {
    isShiftOpen: boolean;
    lines: PosCartLineItem[];
    payments: PosPaymentLine[];
    netPayableCop: number;
  }): Result<PosPaymentLine[]> {
    if (!params.isShiftOpen) {
      return Result.fail(
        'El turno de caja se encuentra cerrado. Abre el turno de caja antes de emitir facturas.'
      );
    }

    if (!params.lines || params.lines.length === 0) {
      return Result.fail('Agrega al menos un producto al ticket de venta antes de facturar.');
    }

    return PosCartModel.validatePayments(params.payments, params.netPayableCop);
  }

  public static resolveReceiptPaymentMethod(payments: PosPaymentLine[]): PosReceiptPaymentMethod {
    return payments.length === 1 ? payments[0].method : 'SPLIT';
  }

  public static getReceiptPaymentLabel(payments: PosPaymentLine[]): string {
    if (payments.length === 1) return PosCartModel.getPaymentMethodLabel(payments[0].method);
    return `Pago dividido (${payments.map((p) => PosCartModel.getShortMethodLabel(p.method)).join(' + ')})`;
  }

  public static getShortMethodLabel(method: PosPaymentMethod): string {
    const map: Record<PosPaymentMethod, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER_BRE_B: 'Bre-B QR',
    };
    return map[method];
  }

  public static generateCufeHash(invoiceNumber: string, netPayable: number): string {
    const seed = `${invoiceNumber}-${netPayable}-${Date.now()}-DIAN-UBL21-NATSARSTORE`;
    let hex = '';
    for (let i = 0; i < 96; i++) {
      const charCode = seed.charCodeAt(i % seed.length) + i * 17;
      hex += (charCode % 16).toString(16);
    }
    return hex.toLowerCase();
  }

  public static getPaymentMethodLabel(method: PosPaymentMethod): string {
    const map: Record<PosPaymentMethod, string> = {
      CASH: 'Efectivo en Caja',
      CARD: 'Tarjeta Débito / Crédito (Datáfono)',
      TRANSFER_BRE_B: 'Pago Inmediato Bre-B / QR Transferencia',
    };
    return map[method];
  }
}
