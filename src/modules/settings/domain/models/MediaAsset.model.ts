import { Result } from '@shared/domain/Result';

export interface MediaCategoryDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface MediaAssetProps {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  categoryId: string | null;
  categoryName: string;
  ownerType: string;
  createdAt: string;
}

export interface UploadMediaAssetPayload {
  fileName: string;
  content: string; // Base64 o DataURL
  mimeType: string;
  sizeBytes: number;
  categoryId: string;
  ownerType?: string;
}

export interface SaveMediaCategoryDraft {
  name: string;
  description?: string | null;
}

/**
 * Modelo Rico de Dominio MediaAssetModel (DDD - Diseño en Modelos)
 * Homologado con `/api/v1/media` y `/api/v1/media/categories`.
 */
export class MediaAssetModel {
  public readonly props: Readonly<MediaAssetProps>;

  constructor(props: MediaAssetProps) {
    this.props = Object.freeze(props);
  }

  public static validateCategoryDraft(
    draft: SaveMediaCategoryDraft
  ): Result<SaveMediaCategoryDraft> {
    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 100) {
      return Result.fail('El nombre de la categoría multimedia debe tener entre 2 y 100 caracteres.');
    }
    return Result.ok({
      name,
      description: draft.description?.trim() || null,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get isImage(): boolean {
    return this.props.mimeType.startsWith('image/');
  }

  public get formattedSize(): string {
    const bytes = this.props.sizeBytes || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  public get formattedDate(): string {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(this.props.createdAt));
    } catch {
      return this.props.createdAt;
    }
  }
}
