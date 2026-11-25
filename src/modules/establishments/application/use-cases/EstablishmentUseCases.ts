import { Result } from '@shared/domain/Result';
import {
  EstablishmentModel,
  SaveEstablishmentDraft,
} from '../../domain/models/Establishment.model';
import { EstablishmentRepositoryPort } from '../../domain/ports/EstablishmentRepositoryPort';

/**
 * Casos de Uso del Módulo de Sedes POS (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class EstablishmentUseCases {
  constructor(private readonly repository: EstablishmentRepositoryPort) {}

  public async getEstablishments(search?: string): Promise<Result<EstablishmentModel[]>> {
    return this.repository.listEstablishments(search);
  }

  public async createEstablishment(
    draft: SaveEstablishmentDraft
  ): Promise<Result<EstablishmentModel>> {
    const validOrErr = EstablishmentModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createEstablishment(validOrErr.getValue());
  }

  public async updateEstablishment(
    id: string,
    draft: SaveEstablishmentDraft
  ): Promise<Result<EstablishmentModel>> {
    const validOrErr = EstablishmentModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateEstablishment(id, validOrErr.getValue());
  }

  public async deleteEstablishment(establishment: EstablishmentModel): Promise<Result<void>> {
    if (establishment.isMain) {
      return Result.fail('No es posible eliminar la sede principal del comercio.');
    }
    return this.repository.deleteEstablishment(establishment.id);
  }
}
