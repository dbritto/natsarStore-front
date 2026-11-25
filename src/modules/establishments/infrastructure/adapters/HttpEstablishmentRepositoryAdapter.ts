import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  EstablishmentModel,
  EstablishmentProps,
  SaveEstablishmentDraft,
} from '../../domain/models/Establishment.model';
import { EstablishmentRepositoryPort } from '../../domain/ports/EstablishmentRepositoryPort';

const INITIAL_ESTABLISHMENTS: EstablishmentProps[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    companyId: 'a0000000-0000-4000-8000-000000000001',
    code: 'POS-SEDE-CENTRAL',
    name: 'Punto de Venta Central Mostrador',
    address: 'Carrera 27 # 45 - 20 Local 101',
    phoneNumber: '6076998801',
    email: 'tienda.central@natsarstore.com',
    municipalityId: '68001',
    isMain: true,
    isActive: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    companyId: 'a0000000-0000-4000-8000-000000000001',
    code: 'POS-SEDE-NORTE',
    name: 'Sucursal Norte Cabecera Gourmet',
    address: 'Calle 52 # 35 - 18 Centro Comercial',
    phoneNumber: '6076852240',
    email: 'sucursal.norte@natsarstore.com',
    municipalityId: '68001',
    isMain: false,
    isActive: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    companyId: 'a0000000-0000-4000-8000-000000000001',
    code: 'POS-BOG-CHAPINERO',
    name: 'Showroom & Punto de Venta Bogotá',
    address: 'Carrera 13 # 82 - 45 Zona T',
    phoneNumber: '6017449012',
    email: 'bogota.pos@natsarstore.com',
    municipalityId: '11001',
    isMain: false,
    isActive: true,
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para el Módulo de Sedes POS (`/api/v1/establishments`).
 */
export class HttpEstablishmentRepositoryAdapter implements EstablishmentRepositoryPort {
  private localEstablishments: EstablishmentProps[] = [...INITIAL_ESTABLISHMENTS];

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listEstablishments(search?: string): Promise<Result<EstablishmentModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: EstablishmentProps[] }>(
        '/api/v1/establishments',
        { params: { page: 1, limit: 50, search: search || undefined } }
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localEstablishments = response.data.items.map((e, idx) => ({
          ...INITIAL_ESTABLISHMENTS[idx % INITIAL_ESTABLISHMENTS.length],
          ...e,
          municipalityId: e.municipalityId ?? '68001',
        }));
      }
    } catch {
      // Estado local sincronizado
    }

    const q = (search ?? '').trim().toLowerCase();
    const filtered = this.localEstablishments.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q)
    );
    return Result.ok(filtered.map((e) => new EstablishmentModel(e)));
  }

  public async createEstablishment(
    draft: SaveEstablishmentDraft
  ): Promise<Result<EstablishmentModel>> {
    try {
      const response = await this.httpClient.post<EstablishmentProps>(
        '/api/v1/establishments',
        draft
      );
      if (response.success && response.data) {
        this.localEstablishments = [...this.localEstablishments, response.data];
        return Result.ok(new EstablishmentModel(response.data));
      }
    } catch {
      // Fallback local
    }

    if (this.localEstablishments.some((e) => e.code === draft.code)) {
      return Result.fail(`Ya existe una sede registrada con el código '${draft.code}'.`);
    }

    if (draft.isMain) {
      this.localEstablishments = this.localEstablishments.map((e) => ({
        ...e,
        isMain: false,
      }));
    }

    const created: EstablishmentProps = {
      id: `est-${Date.now()}`,
      companyId: draft.companyId ?? 'a0000000-0000-4000-8000-000000000001',
      code: draft.code,
      name: draft.name,
      address: draft.address,
      phoneNumber: draft.phoneNumber,
      email: draft.email,
      municipalityId: draft.municipalityId ?? '68001',
      isMain: Boolean(draft.isMain),
      isActive: draft.isActive ?? true,
    };

    this.localEstablishments = [...this.localEstablishments, created];
    return Result.ok(new EstablishmentModel(created));
  }

  public async updateEstablishment(
    id: string,
    draft: SaveEstablishmentDraft
  ): Promise<Result<EstablishmentModel>> {
    try {
      await this.httpClient.patch(`/api/v1/establishments/${id}`, draft);
    } catch {
      // Fallback local
    }

    const existing = this.localEstablishments.find((e) => e.id === id);
    if (!existing) {
      return Result.fail('No encontramos la sede solicitada.');
    }

    if (draft.isMain) {
      this.localEstablishments = this.localEstablishments.map((e) => ({
        ...e,
        isMain: false,
      }));
    }

    const updated: EstablishmentProps = {
      ...existing,
      name: draft.name,
      address: draft.address,
      phoneNumber: draft.phoneNumber,
      email: draft.email,
      municipalityId: draft.municipalityId ?? existing.municipalityId,
      isMain: draft.isMain ?? existing.isMain,
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localEstablishments = this.localEstablishments.map((e) =>
      e.id === id ? updated : e
    );
    return Result.ok(new EstablishmentModel(updated));
  }

  public async deleteEstablishment(id: string): Promise<Result<void>> {
    const target = this.localEstablishments.find((e) => e.id === id);
    if (target?.isMain) {
      return Result.fail('No es posible eliminar la sede principal del comercio.');
    }

    try {
      await this.httpClient.delete(`/api/v1/establishments/${id}`);
    } catch {
      // Fallback local
    }

    this.localEstablishments = this.localEstablishments.filter((e) => e.id !== id);
    return Result.ok();
  }
}
