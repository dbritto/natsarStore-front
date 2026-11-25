import { Result } from '@shared/domain/Result';
import {
  EstablishmentModel,
  SaveEstablishmentDraft,
} from '../models/Establishment.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo de Sedes POS.
 */
export interface EstablishmentRepositoryPort {
  listEstablishments(search?: string): Promise<Result<EstablishmentModel[]>>;
  createEstablishment(draft: SaveEstablishmentDraft): Promise<Result<EstablishmentModel>>;
  updateEstablishment(
    id: string,
    draft: SaveEstablishmentDraft
  ): Promise<Result<EstablishmentModel>>;
  deleteEstablishment(id: string): Promise<Result<void>>;
}
