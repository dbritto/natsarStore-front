import { Result } from '@shared/domain/Result';
import { CustomerModel } from '@modules/customers/domain/models/Customer.model';
import {
  TaxCalculationResultDto,
  TaxLiquidationModel,
} from '@modules/customers/domain/models/TaxLiquidation.model';

export type PosPaymentMethod = 'CASH' | 'CARD' | 'TRANSFER_BRE_B';

export interface PosCartLineItem {
  catalogItemId: string;
  codeReference: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  tributeCode: '01' | '04' | 'ZZ';
  taxRate: number;
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
  paymentMethod: PosPaymentMethod;
  paymentMethodLabel: string;
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

  public static validateCheckout(params: {
    isShiftOpen: boolean;
    lines: PosCartLineItem[];
    paymentMethod: PosPaymentMethod;
    netPayableCop: number;
    cashTenderedCop: number;
  }): Result<void> {
    if (!params.isShiftOpen) {
      return Result.fail(
        'El turno de caja se encuentra cerrado. Abre el turno de caja antes de emitir facturas.'
      );
    }

    if (!params.lines || params.lines.length === 0) {
      return Result.fail('Agrega al menos un producto al ticket de venta antes de facturar.');
    }

    if (params.paymentMethod === 'CASH' && params.cashTenderedCop < params.netPayableCop) {
      return Result.fail(
        `El efectivo recibido ($ ${params.cashTenderedCop.toLocaleString('es-CO')}) es menor al total neto a cobrar ($ ${params.netPayableCop.toLocaleString('es-CO')}).`
      );
    }

    return Result.ok();
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
