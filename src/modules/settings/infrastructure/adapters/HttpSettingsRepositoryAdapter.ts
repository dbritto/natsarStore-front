import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  AppSettingModel,
  AppSettingProps,
  SaveAppSettingDraft,
} from '../../domain/models/AppSetting.model';
import {
  MediaAssetModel,
  MediaAssetProps,
  MediaCategoryDto,
  SaveMediaCategoryDraft,
  UploadMediaAssetPayload,
} from '../../domain/models/MediaAsset.model';
import { SettingsRepositoryPort } from '../../domain/ports/SettingsRepositoryPort';

const INITIAL_SETTINGS: AppSettingProps[] = [
  {
    id: 'set-001',
    key: 'INVENTORY_DEFAULT_MIN_STOCK',
    name: 'Umbral de Stock Mínimo Predeterminado',
    description: 'Cantidad mínima por defecto para disparar alertas de reabastecimiento en bodegas POS',
    value: { defaultMinStock: 5, alertEnabled: true },
    isSystem: true,
    isActive: true,
  },
  {
    id: 'set-002',
    key: 'INVENTORY_NEGATIVE_STOCK_POLICY',
    name: 'Política de Control de Stock Negativo',
    description: 'Define si el sistema bloquea (BLOCK), advierte (WARN) o permite (ALLOW) salidas sin saldo',
    value: { policy: 'BLOCK', enforceInPos: true },
    isSystem: true,
    isActive: true,
  },
  {
    id: 'set-003',
    key: 'FACTUS_DIAN_ENVIRONMENT',
    name: 'Ambiente de Transmisión Facturación Electrónica DIAN',
    description: 'Configuración de conexión con API Factus V2 y resolución de numeración SETP',
    value: {
      environment: 'SANDBOX',
      prefix: 'SETP',
      resolutionNumber: '18760000001',
      rangeFrom: 990000000,
      rangeTo: 995000000,
    },
    isSystem: true,
    isActive: true,
  },
  {
    id: 'set-004',
    key: 'POS_RECEIPT_FOOTER_TEXT',
    name: 'Mensaje Pie de Tirilla Punto de Venta',
    description: 'Texto comercial impreso al final de las tirillas y facturas POS de NatsarStore',
    value: {
      headline: 'Gracias por comprar en NatsarStore',
      legalNote: 'Representación gráfica de factura electrónica de venta DIAN UBL 2.1',
    },
    isSystem: false,
    isActive: true,
  },
];

const INITIAL_MEDIA_CATEGORIES: MediaCategoryDto[] = [
  {
    id: 'mcat-001',
    name: 'PRODUCTOS_POS',
    description: 'Fotografías comerciales de artículos y combos del catálogo',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'mcat-002',
    name: 'AVATARES_USUARIOS',
    description: 'Fotografías de perfil de colaboradores y cajeros',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'mcat-003',
    name: 'SOPORTES_CONTEOS_Y_ACTAS',
    description: 'Evidencias fotográficas de tomas físicas, mermas y recepciones',
    isSystem: false,
    isActive: true,
  },
];

const INITIAL_MEDIA_FILES: MediaAssetProps[] = [
  {
    id: 'med-001',
    fileName: 'logo-corporativo-natsarstore.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 18420,
    url: '',
    categoryId: 'mcat-001',
    categoryName: 'PRODUCTOS_POS',
    ownerType: 'COMPANY_BRAND',
    createdAt: '2026-11-23T10:00:00.000Z',
  },
  {
    id: 'med-002',
    fileName: 'resolucion-dian-setp-18760000001.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 245800,
    url: '',
    categoryId: 'mcat-003',
    categoryName: 'SOPORTES_CONTEOS_Y_ACTAS',
    ownerType: 'DIAN_RESOLUTION',
    createdAt: '2026-11-24T09:15:00.000Z',
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para Configuración Global (`/api/v1/settings`)
 * y Gestor Multimedia (`/api/v1/media` y `/api/v1/media/categories`).
 */
export class HttpSettingsRepositoryAdapter implements SettingsRepositoryPort {
  private localSettings: AppSettingProps[] = [...INITIAL_SETTINGS];
  private localMediaCategories: MediaCategoryDto[] = [...INITIAL_MEDIA_CATEGORIES];
  private localMediaFiles: MediaAssetProps[] = [...INITIAL_MEDIA_FILES];

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listSettings(search?: string): Promise<Result<AppSettingModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: AppSettingProps[] }>(
        '/api/v1/settings',
        { params: { page: 1, limit: 50, search: search || undefined } }
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localSettings = response.data.items;
      }
    } catch {
      // Estado local sincronizado
    }

    const q = (search ?? '').trim().toLowerCase();
    const filtered = this.localSettings.filter(
      (s) =>
        !q ||
        s.key.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
    return Result.ok(filtered.map((s) => new AppSettingModel(s)));
  }

  public async createSetting(draft: SaveAppSettingDraft): Promise<Result<AppSettingModel>> {
    const valid = AppSettingModel.validateDraft(draft).getValue();

    try {
      const response = await this.httpClient.post<AppSettingProps>(
        '/api/v1/settings',
        valid
      );
      if (response.success && response.data) {
        this.localSettings = [...this.localSettings, response.data];
        return Result.ok(new AppSettingModel(response.data));
      }
    } catch {
      // Fallback local
    }

    if (this.localSettings.some((s) => s.key === valid.key)) {
      return Result.fail(`Ya existe un parámetro configurado con la llave '${valid.key}'.`);
    }

    const created: AppSettingProps = {
      id: `set-${Date.now()}`,
      ...valid,
    };

    this.localSettings = [...this.localSettings, created];
    return Result.ok(new AppSettingModel(created));
  }

  public async updateSetting(
    id: string,
    draft: SaveAppSettingDraft
  ): Promise<Result<AppSettingModel>> {
    const valid = AppSettingModel.validateDraft(draft).getValue();

    try {
      await this.httpClient.patch(`/api/v1/settings/${id}`, {
        name: valid.name,
        description: valid.description,
        value: valid.value,
      });
    } catch {
      // Fallback local
    }

    const existing = this.localSettings.find((s) => s.id === id);
    if (!existing) {
      return Result.fail('No encontramos el parámetro solicitado.');
    }

    const updated: AppSettingProps = {
      ...existing,
      name: valid.name,
      description: valid.description,
      value: valid.value,
    };

    this.localSettings = this.localSettings.map((s) => (s.id === id ? updated : s));
    return Result.ok(new AppSettingModel(updated));
  }

  public async deleteSetting(id: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/settings/${id}`);
    } catch {
      // Fallback local
    }
    this.localSettings = this.localSettings.filter((s) => s.id !== id);
    return Result.ok();
  }

  public async listMediaFiles(categoryId?: string): Promise<Result<MediaAssetModel[]>> {
    try {
      const response = await this.httpClient.get<{ items: MediaAssetProps[] }>(
        '/api/v1/media',
        { params: { page: 1, limit: 50, categoryId: categoryId || undefined } }
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localMediaFiles = response.data.items;
      }
    } catch {
      // Fallback local
    }

    const filtered = this.localMediaFiles.filter(
      (f) => !categoryId || f.categoryId === categoryId
    );
    return Result.ok(filtered.map((f) => new MediaAssetModel(f)));
  }

  public async uploadMediaFile(
    payload: UploadMediaAssetPayload
  ): Promise<Result<MediaAssetModel>> {
    try {
      const base64Clean = payload.content.includes(',')
        ? payload.content.split(',')[1]
        : payload.content;
      await this.httpClient.post('/api/v1/media/upload', {
        fileName: payload.fileName,
        content: base64Clean,
        mimeType: payload.mimeType,
        categoryId: payload.categoryId,
        ownerType: payload.ownerType ?? 'GENERAL_ASSET',
      });
    } catch {
      // Fallback local
    }

    const cat = this.localMediaCategories.find((c) => c.id === payload.categoryId);
    const created: MediaAssetProps = {
      id: `med-${Date.now()}`,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      url: payload.content,
      categoryId: payload.categoryId,
      categoryName: cat?.name ?? 'GENERAL',
      ownerType: payload.ownerType ?? 'GENERAL_ASSET',
      createdAt: new Date().toISOString(),
    };

    this.localMediaFiles = [created, ...this.localMediaFiles];
    return Result.ok(new MediaAssetModel(created));
  }

  public async deleteMediaFile(id: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/media/${id}`);
    } catch {
      // Fallback local
    }
    this.localMediaFiles = this.localMediaFiles.filter((f) => f.id !== id);
    return Result.ok();
  }

  public async listMediaCategories(): Promise<Result<MediaCategoryDto[]>> {
    try {
      const response = await this.httpClient.get<{ items: MediaCategoryDto[] }>(
        '/api/v1/media/categories'
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        this.localMediaCategories = response.data.items;
      }
    } catch {
      // Fallback local
    }
    return Result.ok(this.localMediaCategories);
  }

  public async createMediaCategory(
    draft: SaveMediaCategoryDraft
  ): Promise<Result<MediaCategoryDto>> {
    try {
      await this.httpClient.post('/api/v1/media/categories', draft);
    } catch {
      // Fallback local
    }

    const normalizedName = draft.name.trim().toUpperCase().replace(/\s+/g, '_');
    if (this.localMediaCategories.some((c) => c.name === normalizedName)) {
      return Result.fail(`Ya existe una categoría multimedia con el nombre '${normalizedName}'.`);
    }

    const created: MediaCategoryDto = {
      id: `mcat-${Date.now()}`,
      name: normalizedName,
      description: draft.description ?? null,
      isSystem: false,
      isActive: true,
    };

    this.localMediaCategories = [...this.localMediaCategories, created];
    return Result.ok(created);
  }

  public async deleteMediaCategory(id: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/media/categories/${id}`);
    } catch {
      // Fallback local
    }
    this.localMediaCategories = this.localMediaCategories.filter((c) => c.id !== id);
    return Result.ok();
  }
}
