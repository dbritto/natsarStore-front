import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export interface EstablishmentProps {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  municipalityId: string | null;
  isMain: boolean;
  isActive: boolean;
}

export interface SaveEstablishmentDraft {
  companyId?: string;
  code: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  municipalityId?: string | null;
  isMain?: boolean;
  isActive?: boolean;
}

/**
 * Entidad / Modelo Rico de Dominio EstablishmentModel (DDD - Diseño en Modelos)
 * Homologado con `Establishment` del backend (`/api/v1/establishments`), incluyendo protección
 * de la sede principal (`isMain: true`).
 */
export class EstablishmentModel extends Entity<EstablishmentProps> {
  private static readonly CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(props: EstablishmentProps) {
    super(props, props.id);
  }

  public static validateDraft(draft: SaveEstablishmentDraft): Result<SaveEstablishmentDraft> {
    const code = (draft.code ?? '').trim().toUpperCase();
    if (!this.CODE_REGEX.test(code)) {
      return Result.fail(
        'El código de la sede debe tener entre 2 y 30 caracteres alfanuméricos, guiones o guiones bajos.'
      );
    }

    const name = (draft.name ?? '').trim();
    if (name.length < 2 || name.length > 200) {
      return Result.fail('El nombre comercial de la sede debe tener entre 2 y 200 caracteres.');
    }

    const address = (draft.address ?? '').trim();
    if (address.length < 3 || address.length > 255) {
      return Result.fail('La dirección física de la sede debe tener entre 3 y 255 caracteres.');
    }

    const phone = (draft.phoneNumber ?? '').trim();
    if (phone.length < 5 || phone.length > 30) {
      return Result.fail('El teléfono de contacto de la sede debe tener entre 5 y 30 caracteres.');
    }

    const email = (draft.email ?? '').trim().toLowerCase();
    if (!this.EMAIL_REGEX.test(email)) {
      return Result.fail('Ingresa un correo electrónico válido para la sede comercial.');
    }

    return Result.ok({
      companyId: draft.companyId || 'a0000000-0000-4000-8000-000000000001',
      code,
      name,
      address,
      phoneNumber: phone,
      email,
      municipalityId: draft.municipalityId || '68001',
      isMain: Boolean(draft.isMain),
      isActive: draft.isActive ?? true,
    });
  }

  public get raw(): Readonly<EstablishmentProps> {
    return this.props;
  }

  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get address(): string {
    return this.props.address;
  }

  public get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  public get email(): string {
    return this.props.email;
  }

  public get isMain(): boolean {
    return this.props.isMain;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get municipalityLabel(): string {
    const map: Record<string, string> = {
      '68001': 'Bucaramanga, Santander',
      '11001': 'Bogotá D.C.',
      '05001': 'Medellín, Antioquia',
      '76001': 'Cali, Valle del Cauca',
    };
    return map[this.props.municipalityId ?? '68001'] ?? 'Bucaramanga, Santander';
  }
}
