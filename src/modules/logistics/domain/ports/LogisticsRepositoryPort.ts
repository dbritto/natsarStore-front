import { Result } from '@shared/domain/Result';
import {
  DispatchTransferDraft,
  ReceiveTransferLineDraft,
  StockTransferModel,
  TransferStatus,
} from '../models/StockTransfer.model';
import {
  PhysicalCountModel,
  PhysicalCountStatus,
  StartPhysicalCountDraft,
  SubmitPhysicalCountLineDraft,
} from '../models/PhysicalCount.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo de Logística:
 * Traslados entre Bodegas en 2 Pasos y Tomas Físicas Ciegas.
 */
export interface LogisticsRepositoryPort {
  // Traslados entre Bodegas (/api/v1/inventory/transfers)
  listTransfers(status?: TransferStatus | ''): Promise<Result<StockTransferModel[]>>;
  dispatchTransfer(draft: DispatchTransferDraft): Promise<Result<StockTransferModel>>;
  receiveTransfer(
    transferId: string,
    items: ReceiveTransferLineDraft[]
  ): Promise<Result<StockTransferModel>>;
  cancelTransfer(transferId: string, reason?: string): Promise<Result<StockTransferModel>>;

  // Tomas Físicas / Conteos Cíclicos (/api/v1/inventory/counts)
  listCounts(status?: PhysicalCountStatus | ''): Promise<Result<PhysicalCountModel[]>>;
  startPhysicalCount(draft: StartPhysicalCountDraft): Promise<Result<PhysicalCountModel>>;
  submitPhysicalCount(
    countId: string,
    items: SubmitPhysicalCountLineDraft[]
  ): Promise<Result<PhysicalCountModel>>;
  approvePhysicalCount(countId: string): Promise<Result<PhysicalCountModel>>;
}
