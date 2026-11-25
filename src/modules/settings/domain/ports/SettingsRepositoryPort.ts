import { Result } from '@shared/domain/Result';
import {
  AppSettingModel,
  SaveAppSettingDraft,
} from '../models/AppSetting.model';
import {
  MediaAssetModel,
  MediaCategoryDto,
  SaveMediaCategoryDraft,
  UploadMediaAssetPayload,
} from '../models/MediaAsset.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para Configuración Global & Multimedia.
 */
export interface SettingsRepositoryPort {
  // Parámetros Globales (/api/v1/settings)
  listSettings(search?: string): Promise<Result<AppSettingModel[]>>;
  createSetting(draft: SaveAppSettingDraft): Promise<Result<AppSettingModel>>;
  updateSetting(id: string, draft: SaveAppSettingDraft): Promise<Result<AppSettingModel>>;
  deleteSetting(id: string): Promise<Result<void>>;

  // Archivos Multimedia (/api/v1/media)
  listMediaFiles(categoryId?: string): Promise<Result<MediaAssetModel[]>>;
  uploadMediaFile(payload: UploadMediaAssetPayload): Promise<Result<MediaAssetModel>>;
  deleteMediaFile(id: string): Promise<Result<void>>;

  // Categorías Multimedia (/api/v1/media/categories)
  listMediaCategories(): Promise<Result<MediaCategoryDto[]>>;
  createMediaCategory(draft: SaveMediaCategoryDraft): Promise<Result<MediaCategoryDto>>;
  deleteMediaCategory(id: string): Promise<Result<void>>;
}
