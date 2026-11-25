import { Result } from '@shared/domain/Result';
import { ValueObject } from '@shared/domain/ValueObject';

export interface BarcodeEntryProps extends Record<string, unknown> {
  barcode: string;
  barcodeType: string;
  unitMeasureCode: string;
  conversionFactor: number;
  isPrimary: boolean;
  isActive: boolean;
}

/**
 * Value Object BarcodeEntry (DDD - Módulo Catálogo)
 * Valida códigos de barras múltiples y factores de conversión (ej. Unidad x1, Caja x12).
 */
export class BarcodeEntry extends ValueObject<BarcodeEntryProps> {
  private constructor(props: BarcodeEntryProps) {
    super(props);
  }

  public static create(raw: Partial<BarcodeEntryProps>): Result<BarcodeEntry> {
    const code = (raw.barcode ?? '').trim();
    if (code.length < 3 || code.length > 80) {
      return Result.fail('El código de barras debe tener entre 3 y 80 caracteres.');
    }

    const factor = Number(raw.conversionFactor ?? 1);
    if (!Number.isFinite(factor) || factor <= 0) {
      return Result.fail('El factor de conversión del código de barras debe ser mayor a 0.');
    }

    return Result.ok(
      new BarcodeEntry({
        barcode: code,
        barcodeType: (raw.barcodeType ?? 'EAN13').trim().toUpperCase(),
        unitMeasureCode: (raw.unitMeasureCode ?? '94').trim().toUpperCase(),
        conversionFactor: factor,
        isPrimary: raw.isPrimary ?? false,
        isActive: raw.isActive ?? true,
      })
    );
  }

  public toDto(): BarcodeEntryProps {
    return { ...this.props };
  }
}
