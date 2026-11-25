import { Result } from '@shared/domain/Result';
import {
  CustomerModel,
  CustomerType,
  SaveCustomerDraft,
} from '../models/Customer.model';
import {
  TaxCalculationItemInput,
  TaxLiquidationModel,
} from '../models/TaxLiquidation.model';

export interface CustomersFilter {
  search?: string;
  customerType?: CustomerType | '';
}

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo de Clientes & Motor Tributario DIAN.
 */
export interface CustomerRepositoryPort {
  listCustomers(filter?: CustomersFilter): Promise<Result<CustomerModel[]>>;
  createCustomer(draft: SaveCustomerDraft): Promise<Result<CustomerModel>>;
  updateCustomer(id: string, draft: SaveCustomerDraft): Promise<Result<CustomerModel>>;
  calculateTaxesForCustomer(
    customer: CustomerModel,
    items: TaxCalculationItemInput[]
  ): Promise<Result<TaxLiquidationModel>>;
}
