import { Result } from '@shared/domain/Result';
import { DianNit } from '../../domain/value-objects/DianNit.vo';
import {
  CustomerRegimeType,
  DianTaxType,
  TaxSettlementModel,
} from '../../domain/models/TaxSettlement.model';

export interface SimulateTaxCommand {
  rawNit: string;
  regime: CustomerRegimeType;
  baseAmountCop: number;
  taxType: DianTaxType;
}

/**
 * Caso de Uso SimulatePosCheckoutUseCase (Capa de Aplicación)
 * Ejecuta la simulación tributaria POS / DIAN validando invariantes del NIT y régimen fiscal.
 */
export class SimulatePosCheckoutUseCase {
  public execute(command: SimulateTaxCommand): Result<TaxSettlementModel> {
    const nitOrError = DianNit.create(command.rawNit);
    if (nitOrError.isFailure) {
      return Result.fail<TaxSettlementModel>(nitOrError.error!);
    }

    if (!Number.isFinite(command.baseAmountCop) || command.baseAmountCop <= 0) {
      return Result.fail<TaxSettlementModel>('El subtotal de la venta debe ser mayor a $0 COP.');
    }

    const settlement = TaxSettlementModel.calculate({
      customerNit: nitOrError.getValue(),
      customerRegime: command.regime,
      baseAmountCop: command.baseAmountCop,
      taxType: command.taxType,
    });

    return Result.ok(settlement);
  }
}
