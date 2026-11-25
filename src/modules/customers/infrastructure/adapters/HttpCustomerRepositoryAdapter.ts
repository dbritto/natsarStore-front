import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  CustomerModel,
  CustomerProps,
  SaveCustomerDraft,
} from '../../domain/models/Customer.model';
import {
  TaxCalculationItemInput,
  TaxCalculationResultDto,
  TaxLiquidationModel,
} from '../../domain/models/TaxLiquidation.model';
import {
  CustomerRepositoryPort,
  CustomersFilter,
} from '../../domain/ports/CustomerRepositoryPort';

const INITIAL_CUSTOMERS: CustomerProps[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    customerType: 'CONSUMIDOR_FINAL',
    identificationDocumentCode: '13',
    identification: '222222222222',
    dv: null,
    legalOrganizationCode: '2',
    company: null,
    tradeName: null,
    names: 'CONSUMIDOR FINAL',
    tributeCode: 'ZZ',
    responsibilities: ['R-99-PN'],
    municipalityCode: '68001',
    address: 'Punto de Venta Mostrador',
    email: 'consumidorfinal@natsarstore.com',
    phone: '0000000',
    defaultPaymentFormCode: '1',
    creditDays: 0,
    isActive: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    customerType: 'EMPRESA',
    identificationDocumentCode: '31',
    identification: '901458210',
    dv: CustomerModel.calculateDianDv('901458210'),
    legalOrganizationCode: '1',
    company: 'GRUPO COMERCIAL ANDINO S.A.S.',
    tradeName: 'Grupo Andino',
    names: 'GRUPO COMERCIAL ANDINO S.A.S.',
    tributeCode: '01',
    responsibilities: ['O-23'],
    municipalityCode: '11001',
    address: 'Calle 93B # 17 - 25 Oficina 502, Bogotá D.C.',
    email: 'facturacion.fev@grupoandino.co',
    phone: '6017428890',
    defaultPaymentFormCode: '2',
    creditDays: 30,
    isActive: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    customerType: 'EMPRESA',
    identificationDocumentCode: '31',
    identification: '890903938',
    dv: CustomerModel.calculateDianDv('890903938'),
    legalOrganizationCode: '1',
    company: 'INVERSIONES LOGÍSTICAS DEL ORIENTE S.A.',
    tradeName: 'LogiOriente',
    names: 'INVERSIONES LOGÍSTICAS DEL ORIENTE S.A.',
    tributeCode: '01',
    responsibilities: ['O-13', 'O-15', 'O-23'],
    municipalityCode: '68001',
    address: 'Carrera 27 # 45 - 80 Piso 4, Bucaramanga',
    email: 'recepcion.dian@logisticaoriente.com',
    phone: '6076854410',
    defaultPaymentFormCode: '2',
    creditDays: 45,
    isActive: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    customerType: 'PARTICULAR',
    identificationDocumentCode: '13',
    identification: '1098765432',
    dv: null,
    legalOrganizationCode: '2',
    company: null,
    tradeName: null,
    names: 'Camila Andrea Restrepo Gómez',
    tributeCode: 'ZZ',
    responsibilities: ['O-47'],
    municipalityCode: '05001',
    address: 'Avenida El Poblado # 10 - 45, Medellín',
    email: 'camila.restrepo@correo.co',
    phone: '3158901122',
    defaultPaymentFormCode: '1',
    creditDays: 0,
    isActive: true,
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para el Módulo de Clientes & Motor Tributario DIAN.
 * Conecta con `/api/v1/customers` y `/api/v1/customers/:id/calculate-taxes`.
 */
export class HttpCustomerRepositoryAdapter implements CustomerRepositoryPort {
  private localCustomers: CustomerProps[] = [...INITIAL_CUSTOMERS];

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listCustomers(filter?: CustomersFilter): Promise<Result<CustomerModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: CustomerProps[] }>('/api/v1/customers', {
        params: {
          page: 1,
          limit: 50,
          customerType: filter?.customerType || undefined,
          search: filter?.search || undefined,
        },
      });
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localCustomers = response.data.items.map((c, idx) => ({
          ...INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length],
          ...c,
        }));
      }
    } catch {
      // Estado local sincronizado
    }

    const q = (filter?.search ?? '').trim().toLowerCase();
    const filtered = this.localCustomers.filter((c) => {
      if (filter?.customerType && c.customerType !== filter.customerType) return false;
      if (!q) return true;
      return (
        c.names.toLowerCase().includes(q) ||
        c.identification.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });

    return Result.ok(filtered.map((c) => new CustomerModel(c)));
  }

  public async createCustomer(draft: SaveCustomerDraft): Promise<Result<CustomerModel>> {
    try {
      const response = await this.httpClient.post<CustomerProps>('/api/v1/customers', draft);
      if (response.success && response.data) {
        this.localCustomers = [response.data, ...this.localCustomers];
        return Result.ok(new CustomerModel(response.data));
      }
    } catch {
      // Fallback local
    }

    if (this.localCustomers.some((c) => c.identification === draft.identification)) {
      return Result.fail(
        `Ya existe un cliente registrado con el documento o NIT '${draft.identification}'.`
      );
    }

    const created: CustomerProps = {
      id: `cust-${Date.now()}`,
      customerType: draft.customerType,
      identificationDocumentCode: draft.identificationDocumentCode,
      identification: draft.identification,
      dv: draft.dv ?? null,
      legalOrganizationCode: draft.legalOrganizationCode,
      company: draft.company ?? null,
      tradeName: draft.tradeName ?? null,
      names: draft.names,
      tributeCode: draft.tributeCode,
      responsibilities: draft.responsibilities,
      municipalityCode: draft.municipalityCode ?? '68001',
      address: draft.address ?? 'Sin dirección registrada',
      email: draft.email ?? '',
      phone: draft.phone ?? '',
      defaultPaymentFormCode: draft.defaultPaymentFormCode,
      creditDays: draft.creditDays,
      isActive: draft.isActive ?? true,
    };

    this.localCustomers = [created, ...this.localCustomers];
    return Result.ok(new CustomerModel(created));
  }

  public async updateCustomer(
    id: string,
    draft: SaveCustomerDraft
  ): Promise<Result<CustomerModel>> {
    try {
      const response = await this.httpClient.put<CustomerProps>(`/api/v1/customers/${id}`, draft);
      if (response.success && response.data) {
        this.localCustomers = this.localCustomers.map((c) =>
          c.id === id ? response.data! : c
        );
        return Result.ok(new CustomerModel(response.data));
      }
    } catch {
      // Fallback local
    }

    const existing = this.localCustomers.find((c) => c.id === id);
    if (!existing) {
      return Result.fail('No encontramos el cliente solicitado.');
    }

    const updated: CustomerProps = {
      ...existing,
      customerType: draft.customerType,
      identificationDocumentCode: draft.identificationDocumentCode,
      identification: draft.identification,
      dv: draft.dv ?? null,
      legalOrganizationCode: draft.legalOrganizationCode,
      company: draft.company ?? null,
      tradeName: draft.tradeName ?? null,
      names: draft.names,
      tributeCode: draft.tributeCode,
      responsibilities: draft.responsibilities,
      municipalityCode: draft.municipalityCode ?? existing.municipalityCode,
      address: draft.address ?? existing.address,
      email: draft.email ?? existing.email,
      phone: draft.phone ?? existing.phone,
      defaultPaymentFormCode: draft.defaultPaymentFormCode,
      creditDays: draft.creditDays,
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localCustomers = this.localCustomers.map((c) => (c.id === id ? updated : c));
    return Result.ok(new CustomerModel(updated));
  }

  public async calculateTaxesForCustomer(
    customer: CustomerModel,
    items: TaxCalculationItemInput[]
  ): Promise<Result<TaxLiquidationModel>> {
    try {
      const response = await this.httpClient.post<TaxCalculationResultDto>(
        `/api/v1/customers/${customer.id}/calculate-taxes`,
        {
          municipalityCode: customer.raw.municipalityCode ?? '68001',
          items,
        }
      );
      if (response.success && response.data && typeof response.data.netPayable === 'number') {
        return Result.ok(new TaxLiquidationModel(response.data));
      }
    } catch {
      // Ejecutar motor de liquidación de dominio en cliente
    }

    return Result.ok(TaxLiquidationModel.calculateForCustomer(customer, items));
  }
}
