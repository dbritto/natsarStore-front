import { Result } from '@shared/domain/Result';
import {
  CustomerModel,
  SaveCustomerDraft,
} from '../../domain/models/Customer.model';
import {
  TaxCalculationItemInput,
  TaxLiquidationModel,
} from '../../domain/models/TaxLiquidation.model';
import {
  CustomerRepositoryPort,
  CustomersFilter,
} from '../../domain/ports/CustomerRepositoryPort';

/**
 * Casos de Uso del Módulo de Clientes & Motor Tributario DIAN (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class CustomerUseCases {
  constructor(private readonly repository: CustomerRepositoryPort) {}

  public async getCustomers(filter?: CustomersFilter): Promise<Result<CustomerModel[]>> {
    return this.repository.listCustomers(filter);
  }

  public async createCustomer(draft: SaveCustomerDraft): Promise<Result<CustomerModel>> {
    const validOrErr = CustomerModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createCustomer(validOrErr.getValue());
  }

  public async updateCustomer(
    id: string,
    draft: SaveCustomerDraft
  ): Promise<Result<CustomerModel>> {
    const validOrErr = CustomerModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateCustomer(id, validOrErr.getValue());
  }

  public async calculateCustomerTaxes(
    customer: CustomerModel,
    items: TaxCalculationItemInput[]
  ): Promise<Result<TaxLiquidationModel>> {
    if (!Array.isArray(items) || items.length === 0) {
      return Result.fail('Agrega al menos un producto o servicio para liquidar los impuestos.');
    }
    return this.repository.calculateTaxesForCustomer(customer, items);
  }
}
