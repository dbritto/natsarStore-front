import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface AppSettingProps {
  id: string;
  key: string;
  name: string;
  description: string | null;
  value: Record<string, unknown> | string | number | boolean;
  isSystem: boolean;
  isActive: boolean;
}

export interface SaveAppSettingDraft {
  key: string;
  name: string;
  description?: string | null;
  rawValueText: string;
  isSystem?: boolean;
  isActive?: boolean;
}

/**
 * Entidad / Modelo Rico de Dominio AppSettingModel (DDD - Diseño en Modelos)
 * Homologado con `Setting` y el Singleton `AppSettings` del backend (`/api/v1/settings`).
 */
export class AppSettingModel extends Entity<AppSettingProps> {
  private static readonly KEY_REGEX = /^[A-Z][A-Z0-9_]{2,79}$/;

  constructor(props: AppSettingProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveAppSettingDraft): Result<{
    key: string;
    name: string;
    description: string | null;
    value: Record<string, unknown>;
    isSystem: boolean;
    isActive: boolean;
  }> {
    const key = (draft.key ?? '').trim().toUpperCase();
    if (!this.KEY_REGEX.test(key)) {
      return Result.fail(
        'La llave del parámetro debe estar en formato UPPER_SNAKE_CASE (ej: INVENTORY_DEFAULT_MIN_STOCK).'
      );
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 3 || name.length > 150) {
      return Result.fail('El nombre descriptivo del parámetro debe tener entre 3 y 150 caracteres.');
    }

    const rawText = (draft.rawValueText ?? '').trim();
    if (!rawText) {
      return Result.fail('Ingresa un valor o configuración JSON para el parámetro.');
    }

    let parsedValue: Record<string, unknown>;
    try {
      const candidate = JSON.parse(rawText);
      parsedValue =
        typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)
          ? (candidate as Record<string, unknown>)
          : { value: candidate };
    } catch {
      parsedValue = { value: rawText };
    }

    return Result.ok({
      key,
      name,
      description: draft.description?.trim() || null,
      value: parsedValue,
      isSystem: Boolean(draft.isSystem),
      isActive: draft.isActive ?? true,
    });
  }

  public get raw(): Readonly<AppSettingProps> {
    return this.props;
  }

  public get key(): string {
    return this.props.key;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get isSystem(): boolean {
    return this.props.isSystem;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get formattedValueJson(): string {
    if (typeof this.props.value === 'string') return this.props.value;
    return JSON.stringify(this.props.value, null, 2);
  }
}
