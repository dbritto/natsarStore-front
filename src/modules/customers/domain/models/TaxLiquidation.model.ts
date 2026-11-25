import { CustomerModel } from './Customer.model';

export interface TaxCalculationItemInput {
  codeReference: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  isTaxExcluded?: boolean;
  taxRate?: number;
  tributeCode?: string; // '01' IVA, '04' INC
}

export interface AppliedTaxBreakdown {
  code: string;
  name: string;
  rate: number;
  base: number;
  amount: number;
  isExcluded: boolean;
}

export interface AppliedWithholdingBreakdown {
  code: string;
  name: string;
  rate: number;
  base: number;
  amount: number;
  description: string;
}

export interface TaxCalculationResultDto {
  subtotal: number;
  discounts: number;
  taxableBase: number;
  taxes: AppliedTaxBreakdown[];
  withholdings: AppliedWithholdingBreakdown[];
  totalTaxes: number;
  totalWithholdings: number;
  totalInvoice: number;
  netPayable: number;
  notes: string[];
}

/**
 * Modelo Rico de Dominio TaxLiquidationModel (DDD - Diseño en Modelos)
 * Homologado con `TaxCalculationService` del backend (`/api/v1/customers/calculate-taxes`).
 */
export class TaxLiquidationModel {
  public readonly result: Readonly<TaxCalculationResultDto>;

  constructor(result: TaxCalculationResultDto) {
    this.result = Object.freeze(result);
  }

  /**
   * Calcula la liquidación tributaria completa (IVA 01, INC 04, ReteFuente 06, ReteIVA 05 y ReteICA 07)
   * aplicando las reglas del Estatuto Tributario colombiano y el perfil del adquirente.
   */
  public static calculateForCustomer(
    customer: CustomerModel,
    items: TaxCalculationItemInput[]
  ): TaxLiquidationModel {
    let subtotal = 0;
    let discounts = 0;
    const taxes: AppliedTaxBreakdown[] = [];
    const withholdings: AppliedWithholdingBreakdown[] = [];
    const notes: string[] = [];

    for (const item of items) {
      const lineGross = Math.round(item.quantity * item.unitPrice);
      const lineDiscount = Math.round(item.discountAmount ?? 0);
      const lineBase = Math.max(0, lineGross - lineDiscount);

      subtotal += lineGross;
      discounts += lineDiscount;

      const isExcluded = Boolean(item.isTaxExcluded) || (item.taxRate ?? 19) <= 0;
      const rate = isExcluded ? 0 : (item.taxRate ?? 19);
      const tributeCode = item.tributeCode ?? '01';
      const tributeName =
        tributeCode === '04' ? 'INC - Impuesto Nacional al Consumo' : 'IVA - Impuesto sobre las Ventas';
      const amount = Math.round((lineBase * rate) / 100);

      taxes.push({
        code: tributeCode,
        name: `${tributeName} (${item.name})`,
        rate,
        base: lineBase,
        amount,
        isExcluded,
      });
    }

    const taxableBase = Math.max(0, subtotal - discounts);
    const totalTaxes = taxes.reduce((acc, t) => acc + t.amount, 0);
    const totalIva = taxes
      .filter((t) => t.code === '01' && !t.isExcluded)
      .reduce((acc, t) => acc + t.amount, 0);

    if (customer.isConsumidorFinal) {
      notes.push(
        'Venta rápida de mostrador a CONSUMIDOR FINAL (222222222222): No aplican retenciones en la fuente.'
      );
    } else if (!customer.isWithholdingAgent) {
      notes.push(
        `El cliente "${customer.names}" es Persona Natural no agente de retención: Se factura únicamente el impuesto al consumo/IVA sin deducciones.`
      );
    } else {
      // 1. ReteFuente (Compras generales 2.5% a partir de base UVT comercial)
      if (taxableBase >= 100000) {
        const reteFuenteAmount = Math.round(taxableBase * 0.025);
        withholdings.push({
          code: '06',
          name: 'ReteFuente Compras Generales',
          rate: 2.5,
          base: taxableBase,
          amount: reteFuenteAmount,
          description: 'Retención en la fuente 2.5% practicada por Persona Jurídica / Gran Contribuyente',
        });
      }

      // 2. ReteIVA (15% del IVA si el cliente es Gran Contribuyente O-13 o Agente ReteIVA O-23)
      const isReteIvaAgent =
        customer.raw.responsibilities.includes('O-13') ||
        customer.raw.responsibilities.includes('O-23');
      if (isReteIvaAgent && totalIva > 0 && taxableBase >= 100000) {
        const reteIvaAmount = Math.round(totalIva * 0.15);
        withholdings.push({
          code: '05',
          name: 'ReteIVA (15% sobre el IVA)',
          rate: 15,
          base: totalIva,
          amount: reteIvaAmount,
          description: 'Retención de IVA practicada por Gran Contribuyente (O-13) o Agente ReteIVA (O-23)',
        });
      }

      // 3. ReteICA (4.14 por mil = 0.414% actividad comercial)
      if (taxableBase >= 100000) {
        const reteIcaAmount = Math.round(taxableBase * 0.00414);
        withholdings.push({
          code: '07',
          name: 'ReteICA Comercial (4.14‰)',
          rate: 0.414,
          base: taxableBase,
          amount: reteIcaAmount,
          description: `Retención de Industria y Comercio municipio ${customer.raw.municipalityCode ?? '68001'}`,
        });
      }

      notes.push(
        `Adquirente Agente de Retención (${customer.identificationFormatted}): Se calcularon automáticamente las retenciones de ley.`
      );
    }

    const totalWithholdings = withholdings.reduce((acc, w) => acc + w.amount, 0);
    const totalInvoice = taxableBase + totalTaxes;
    const netPayable = Math.max(0, totalInvoice - totalWithholdings);

    return new TaxLiquidationModel({
      subtotal,
      discounts,
      taxableBase,
      taxes,
      withholdings,
      totalTaxes,
      totalWithholdings,
      totalInvoice,
      netPayable,
      notes,
    });
  }

  public static formatCop(amount: number): string {
    return `$ ${Math.round(amount).toLocaleString('es-CO')}`;
  }
}
