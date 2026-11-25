import { Entity } from '@shared/domain/Entity';
import { Result } from '@shared/domain/Result';

export type PhysicalCountStatus = 'OPEN' | 'PENDING_APPROVAL' | 'APPLIED';

export interface PhysicalCountLineItemProps {
  catalogItemId: string;
  codeReference: string;
  productName: string;
  expectedQty: number;
  countedQty: number | null;
  differenceQty: number | null;
  unitCost: number;
}

export interface PhysicalCountProps {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: PhysicalCountStatus;
  isBlindCount: boolean;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  items: PhysicalCountLineItemProps[];
}

export interface StartPhysicalCountDraft {
  warehouseId: string;
  isBlindCount: boolean;
  notes?: string | null;
}

export interface SubmitPhysicalCountLineDraft {
  catalogItemId: string;
  countedQty: number;
}

/**
 * Entidad / Modelo Rico de Dominio PhysicalCountModel (DDD - Diseño en Modelos)
 * Implementa el flujo de Toma Física Ciega en 3 fases:
 * 1) OPEN (Captura ciega por operario: oculta `expectedQty` si `isBlindCount: true`)
 * 2) PENDING_APPROVAL (Revisión de diferencias sobrantes/faltantes por supervisor)
 * 3) APPLIED (Aprobado con generación automática de ajustes `COUNT_SURPLUS` / `COUNT_SHORTAGE` en Kárdex)
 */
export class PhysicalCountModel extends Entity<PhysicalCountProps> {
  constructor(props: PhysicalCountProps) {
    super(props, props.id);
  }

  public static validateStart(draft: StartPhysicalCountDraft): Result<StartPhysicalCountDraft> {
    if (!draft.warehouseId) {
      return Result.fail('Selecciona la bodega donde se realizará la toma física.');
    }
    return Result.ok({
      warehouseId: draft.warehouseId,
      isBlindCount: draft.isBlindCount ?? true,
      notes: draft.notes?.trim() || null,
    });
  }

  public validateSubmission(
    lines: SubmitPhysicalCountLineDraft[]
  ): Result<SubmitPhysicalCountLineDraft[]> {
    if (this.props.status !== 'OPEN') {
      return Result.fail('Solo se pueden registrar conteos en sesiones que estén abiertas.');
    }

    const countedMap = new Map(
      lines.map((l) => [l.catalogItemId, Number(l.countedQty)])
    );

    const validated: SubmitPhysicalCountLineDraft[] = [];
    for (const item of this.props.items) {
      const val = countedMap.get(item.catalogItemId);
      if (val === undefined || !Number.isFinite(val) || val < 0) {
        return Result.fail(
          `Ingresa una cantidad física válida (mayor o igual a 0) para "${item.productName}".`
        );
      }
      validated.push({ catalogItemId: item.catalogItemId, countedQty: val });
    }

    return Result.ok(validated);
  }

  public get raw(): Readonly<PhysicalCountProps> {
    return this.props;
  }

  public get countNumber(): string {
    return this.props.countNumber;
  }

  public get status(): PhysicalCountStatus {
    return this.props.status;
  }

  public get statusLabel(): string {
    const map: Record<PhysicalCountStatus, string> = {
      OPEN: 'Abierto (En Conteo)',
      PENDING_APPROVAL: 'Pendiente Aprobación Supervisor',
      APPLIED: 'Aplicado al Kárdex',
    };
    return map[this.props.status];
  }

  /**
   * Regla de Dominio: Si el conteo es ciego y aún está en estado OPEN,
   * el operario no debe ver el saldo teórico esperado (`expectedQty`).
   */
  public get hideExpectedStock(): boolean {
    return this.props.isBlindCount && this.props.status === 'OPEN';
  }

  public get totalNetVarianceCop(): number {
    if (this.props.status === 'OPEN') return 0;
    return Math.round(
      this.props.items.reduce(
        (acc, item) => acc + (item.differenceQty ?? 0) * item.unitCost,
        0
      )
    );
  }

  public get formattedNetVarianceCop(): string {
    const val = this.totalNetVarianceCop;
    const prefix = val > 0 ? '+ ' : val < 0 ? '- ' : '';
    return `${prefix}$ ${Math.abs(val).toLocaleString('es-CO')}`;
  }

  public get formattedCreatedDate(): string {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(this.props.createdAt));
    } catch {
      return this.props.createdAt;
    }
  }
}
