import { Result } from '@shared/domain/Result';
import {
  AppSettingModel,
  SaveAppSettingDraft,
} from '../../domain/models/AppSetting.model';
import {
  MediaAssetModel,
  MediaCategoryDto,
  SaveMediaCategoryDraft,
  UploadMediaAssetPayload,
} from '../../domain/models/MediaAsset.model';
import { SettingsRepositoryPort } from '../../domain/ports/SettingsRepositoryPort';

/**
 * Casos de Uso del Módulo de Configuración Global & Multimedia (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class SettingsUseCases {
  constructor(private readonly repository: SettingsRepositoryPort) {}

  public async getSettings(search?: string): Promise<Result<AppSettingModel[]>> {
    return this.repository.listSettings(search);
  }

  public async createSetting(draft: SaveAppSettingDraft): Promise<Result<AppSettingModel>> {
    const validOrErr = AppSettingModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createSetting(draft);
  }

  public async updateSetting(
    id: string,
    draft: SaveAppSettingDraft
  ): Promise<Result<AppSettingModel>> {
    const validOrErr = AppSettingModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateSetting(id, draft);
  }

  public async deleteSetting(setting: AppSettingModel): Promise<Result<void>> {
    if (setting.isSystem) {
      return Result.fail(
        `El parámetro "${setting.key}" es fijo del núcleo del sistema y no puede eliminarse.`
      );
    }
    return this.repository.deleteSetting(setting.id);
  }

  public async getMediaFiles(categoryId?: string): Promise<Result<MediaAssetModel[]>> {
    return this.repository.listMediaFiles(categoryId);
  }

  public async uploadMedia(
    payload: UploadMediaAssetPayload
  ): Promise<Result<MediaAssetModel>> {
    if (!payload.fileName || !payload.content) {
      return Result.fail('Selecciona un archivo válido para subir al repositorio.');
    }
    return this.repository.uploadMediaFile(payload);
  }

  public async deleteMedia(id: string): Promise<Result<void>> {
    return this.repository.deleteMediaFile(id);
  }

  public async getMediaCategories(): Promise<Result<MediaCategoryDto[]>> {
    return this.repository.listMediaCategories();
  }

  public async createMediaCategory(
    draft: SaveMediaCategoryDraft
  ): Promise<Result<MediaCategoryDto>> {
    const validOrErr = MediaAssetModel.validateCategoryDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createMediaCategory(validOrErr.getValue());
  }

  public async deleteMediaCategory(cat: MediaCategoryDto): Promise<Result<void>> {
    if (cat.isSystem) {
      return Result.fail(
        `La categoría multimedia "${cat.name}" es protegida del sistema y no puede eliminarse.`
      );
    }
    return this.repository.deleteMediaCategory(cat.id);
  }
}
