import { Result } from '@shared/domain/Result';
import {
  DispatchTransferDraft,
  ReceiveTransferLineDraft,
  StockTransferModel,
  TransferStatus,
} from '../../domain/models/StockTransfer.model';
import {
  PhysicalCountModel,
  PhysicalCountStatus,
  StartPhysicalCountDraft,
  SubmitPhysicalCountLineDraft,
} from '../../domain/models/PhysicalCount.model';
import { LogisticsRepositoryPort } from '../../domain/ports/LogisticsRepositoryPort';

/**
 * Casos de Uso del Módulo de Logística (Capa de Aplicación - Arquitectura Hexagonal)
 * Orquesta validaciones de dominio para Traslados en 2 pasos y Tomas Físicas Ciegas.
 */
export class LogisticsUseCases {
  constructor(private readonly repository: LogisticsRepositoryPort) {}

  public async getTransfers(status?: TransferStatus | ''): Promise<Result<StockTransferModel[]>> {
    return this.repository.listTransfers(status);
  }

  public async dispatchTransfer(
    draft: DispatchTransferDraft
  ): Promise<Result<StockTransferModel>> {
    const validOrErr = StockTransferModel.validateDispatch(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.dispatchTransfer(validOrErr.getValue());
  }

  public async confirmTransferReception(
    transfer: StockTransferModel,
    receivedLines: ReceiveTransferLineDraft[]
  ): Promise<Result<StockTransferModel>> {
    const validOrErr = transfer.validateReception(receivedLines);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.receiveTransfer(transfer.id, validOrErr.getValue());
  }

  public async cancelTransferInTransit(
    transfer: StockTransferModel,
    reason?: string
  ): Promise<Result<StockTransferModel>> {
    if (!transfer.isInTransit) {
      return Result.fail('Solo se pueden cancelar traslados que se encuentran en tránsito.');
    }
    return this.repository.cancelTransfer(transfer.id, reason);
  }

  public async getPhysicalCounts(
    status?: PhysicalCountStatus | ''
  ): Promise<Result<PhysicalCountModel[]>> {
    return this.repository.listCounts(status);
  }

  public async startBlindCount(
    draft: StartPhysicalCountDraft
  ): Promise<Result<PhysicalCountModel>> {
    const validOrErr = PhysicalCountModel.validateStart(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.startPhysicalCount(validOrErr.getValue());
  }

  public async submitCountedQuantities(
    count: PhysicalCountModel,
    lines: SubmitPhysicalCountLineDraft[]
  ): Promise<Result<PhysicalCountModel>> {
    const validOrErr = count.validateSubmission(lines);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.submitPhysicalCount(count.id, validOrErr.getValue());
  }

  public async approvePhysicalCount(
    count: PhysicalCountModel
  ): Promise<Result<PhysicalCountModel>> {
    if (count.status !== 'PENDING_APPROVAL') {
      return Result.fail(
        'La toma física debe estar en estado Pendiente de Aprobación para poder aplicarla al Kárdex.'
      );
    }
    return this.repository.approvePhysicalCount(count.id);
  }
}
