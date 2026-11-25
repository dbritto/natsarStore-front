import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export type CustomerType = 'CONSUMIDOR_FINAL' | 'PARTICULAR' | 'EMPRESA' | 'EXTRANJERO';
export type LegalOrganizationCode = '1' | '2'; // 1: Persona Jurídica, 2: Persona Natural
export type CustomerTributeCode = '01' | '04' | 'ZZ'; // 01: IVA, 04: INC, ZZ: No aplica
export type FiscalResponsibilityCode = 'O-13' | 'O-15' | 'O-23' | 'O-47' | 'R-99-PN';
export type PaymentFormCode = '1' | '2'; // 1: Contado, 2: Crédito

export interface CustomerProps {
  id: string;
  customerType: CustomerType;
  identificationDocumentCode: string; // '13' CC, '31' NIT, '22' CE, '41' Pasaporte
  identification: string;
  dv: string | null;
  legalOrganizationCode: LegalOrganizationCode;
  company: string | null;
  tradeName: string | null;
  names: string;
  tributeCode: CustomerTributeCode;
  responsibilities: FiscalResponsibilityCode[];
  municipalityCode: string | null;
  address: string;
  email: string;
  phone: string;
  defaultPaymentFormCode: PaymentFormCode;
  creditDays: number;
  isActive: boolean;
}

export interface SaveCustomerDraft {
  customerType: CustomerType;
  identificationDocumentCode: string;
  identification: string;
  dv?: string | null;
  legalOrganizationCode: LegalOrganizationCode;
  company?: string | null;
  tradeName?: string | null;
  names: string;
  tributeCode: CustomerTributeCode;
  responsibilities: FiscalResponsibilityCode[];
  municipalityCode?: string | null;
  address?: string;
  email?: string;
  phone?: string;
  defaultPaymentFormCode: PaymentFormCode;
  creditDays: number;
  isActive?: boolean;
}

/**
 * Entidad / Modelo Rico de Dominio CustomerModel (DDD - Diseño en Modelos)
 * Homologado con `Customer` del backend (`/api/v1/customers`), incluyendo el algoritmo
 * oficial Módulo 11 de la DIAN para cálculo automático del Dígito de Verificación (DV).
 */
export class CustomerModel extends Entity<CustomerProps> {
  private static readonly DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(props: CustomerProps) {
    super(props, props.id);
  }

  /**
   * Algoritmo Oficial Módulo 11 de la DIAN para calcular el Dígito de Verificación (DV) de un NIT.
   */
  public static calculateDianDv(rawNit: string): string {
    const clean = (rawNit ?? '').replace(/\D/g, '');
    if (!clean) return '0';
    let sum = 0;
    const len = clean.length;

    for (let i = 0; i < len && i < this.DIAN_WEIGHTS.length; i++) {
      const digit = parseInt(clean[len - 1 - i], 10);
      sum += digit * this.DIAN_WEIGHTS[i];
    }

    const remainder = sum % 11;
    const dv = remainder > 1 ? 11 - remainder : remainder;
    return String(dv);
  }

  public static validateDraft(draft: SaveCustomerDraft): Result<SaveCustomerDraft> {
    const cleanId = (draft.identification ?? '').trim();
    if (cleanId.length < 4 || cleanId.length > 20) {
      return Result.fail('El número de identificación o NIT debe tener entre 4 y 20 caracteres.');
    }

    const effectiveNames = (draft.names || draft.company || '').trim();
    if (effectiveNames.length < 2) {
      return Result.fail('El nombre completo o razón social del adquirente es obligatorio.');
    }

    if (draft.email && draft.email.trim() && !this.EMAIL_REGEX.test(draft.email.trim())) {
      return Result.fail('Ingresa un correo electrónico válido para recepción de facturación.');
    }

    const isNit = draft.identificationDocumentCode === '31' || draft.customerType === 'EMPRESA';
    const computedDv = isNit ? this.calculateDianDv(cleanId) : null;

    return Result.ok({
      ...draft,
      identification: cleanId,
      dv: computedDv,
      names: effectiveNames,
      company: draft.customerType === 'EMPRESA' ? effectiveNames : (draft.company?.trim() || null),
      tradeName: draft.tradeName?.trim() || null,
      email: draft.email?.trim().toLowerCase() || '',
      phone: draft.phone?.trim() || '',
      address: draft.address?.trim() || 'Punto de Venta Mostrador',
      responsibilities:
        draft.responsibilities && draft.responsibilities.length > 0
          ? draft.responsibilities
          : ['R-99-PN'],
      creditDays: draft.defaultPaymentFormCode === '1' ? 0 : Math.max(0, Number(draft.creditDays) || 30),
      isActive: draft.isActive ?? true,
    });
  }

  public get raw(): Readonly<CustomerProps> {
    return this.props;
  }

  public get names(): string {
    return this.props.names;
  }

  public get identificationFormatted(): string {
    if (this.props.identificationDocumentCode === '31' && this.props.dv !== null) {
      return `NIT ${this.props.identification}-${this.props.dv}`;
    }
    const docLabels: Record<string, string> = {
      '13': 'CC',
      '22': 'CE',
      '31': 'NIT',
      '41': 'PAS',
    };
    const prefix = docLabels[this.props.identificationDocumentCode] ?? 'DOC';
    return `${prefix} ${this.props.identification}`;
  }

  public get isConsumidorFinal(): boolean {
    return (
      this.props.customerType === 'CONSUMIDOR_FINAL' ||
      this.props.identification === '222222222222'
    );
  }

  /**
   * Regla de Dominio Estatuto Tributario:
   * Es agente de retención si es Persona Jurídica ('1') o posee responsabilidades O-13, O-15 u O-23.
   */
  public get isWithholdingAgent(): boolean {
    if (this.isConsumidorFinal || this.props.customerType === 'PARTICULAR') {
      return false;
    }
    return (
      this.props.legalOrganizationCode === '1' ||
      this.props.responsibilities.includes('O-13') ||
      this.props.responsibilities.includes('O-15') ||
      this.props.responsibilities.includes('O-23')
    );
  }

  public get customerTypeLabel(): string {
    const map: Record<CustomerType, string> = {
      CONSUMIDOR_FINAL: 'Consumidor Final POS',
      PARTICULAR: 'Persona Natural',
      EMPRESA: 'Empresa / Persona Jurídica',
      EXTRANJERO: 'Adquirente Extranjero',
    };
    return map[this.props.customerType] ?? this.props.customerType;
  }

  public get tributeLabel(): string {
    const map: Record<CustomerTributeCode, string> = {
      '01': 'Responsable IVA (01)',
      '04': 'Impoconsumo INC (04)',
      ZZ: 'No Responsable (ZZ)',
    };
    return map[this.props.tributeCode] ?? 'No Responsable (ZZ)';
  }
}
