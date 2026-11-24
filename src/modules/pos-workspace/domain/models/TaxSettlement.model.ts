import { DianNit } from '../value-objects/DianNit.vo';
import { MoneyCop } from '../value-objects/MoneyCop.vo';

export type DianTaxType = 'IVA_19' | 'IVA_5' | 'EXENTO_0' | 'INC_8';
export type CustomerRegimeType = 'CONSUMIDOR_FINAL' | 'PERSONA_JURIDICA' | 'GRAN_CONTRIBUYENTE';

export interface TaxSettlementProps {
  customerNit: DianNit;
  customerRegime: CustomerRegimeType;
  subtotal: MoneyCop;
  taxType: DianTaxType;
  taxRatePercent: number;
  taxAmount: MoneyCop;
  withholdingAmount: MoneyCop;
  totalPayable: MoneyCop;
}

/**
 * Modelo de Dominio TaxSettlementModel (DDD - Diseño en Modelos)
 * Motor de liquidación tributaria en cliente alineado con las reglas DIAN del backend Factus POS:
 * - IVA (19%, 5%, 0%) o INC (8% Restaurantes/Cafeterías)
 * - Retención en la fuente (2.5% compras generales cuando el comprador es Gran Contribuyente o Persona Jurídica retenedora)
 */
export class TaxSettlementModel {
  public readonly props: Readonly<TaxSettlementProps>;

  private constructor(props: TaxSettlementProps) {
    this.props = Object.freeze(props);
  }

  public static calculate(params: {
    customerNit: DianNit;
    customerRegime: CustomerRegimeType;
    baseAmountCop: number;
    taxType: DianTaxType;
  }): TaxSettlementModel {
    const subtotal = MoneyCop.fromNumber(params.baseAmountCop);
    const rateMap: Record<DianTaxType, number> = {
      IVA_19: 19,
      IVA_5: 5,
      EXENTO_0: 0,
      INC_8: 8,
    };

    const taxRatePercent = rateMap[params.taxType];
    const rawTax = (subtotal.amount * taxRatePercent) / 100;
    const taxAmount = MoneyCop.fromNumber(rawTax);

    // Regla DIAN: ReteFuente 2.5% aplica si el adquirente es agente de retención y no es Consumidor Final
    const appliesWithholding =
      !params.customerNit.isFinalConsumer &&
      (params.customerRegime === 'GRAN_CONTRIBUYENTE' || params.customerRegime === 'PERSONA_JURIDICA') &&
      subtotal.amount >= 100000;

    const rawWithholding = appliesWithholding ? subtotal.amount * 0.025 : 0;
    const withholdingAmount = MoneyCop.fromNumber(rawWithholding);

    const totalPayable = MoneyCop.fromNumber(
      subtotal.amount + taxAmount.amount - withholdingAmount.amount
    );

    return new TaxSettlementModel({
      customerNit: params.customerNit,
      customerRegime: params.customerRegime,
      subtotal,
      taxType: params.taxType,
      taxRatePercent,
      taxAmount,
      withholdingAmount,
      totalPayable,
    });
  }
}
