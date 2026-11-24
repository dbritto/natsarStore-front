import { Result } from '@shared/domain/Result';
import {
  AnalyticsPeriod,
  DashboardAnalyticsModel,
} from '../models/DashboardAnalytics.model';

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal)
 * Contrato para consultar la analítica de inventario, catálogo, clientes y existencias del Swagger.
 */
export interface WorkspaceRepositoryPort {
  getDashboardData(period: AnalyticsPeriod): Promise<Result<DashboardAnalyticsModel>>;
}
