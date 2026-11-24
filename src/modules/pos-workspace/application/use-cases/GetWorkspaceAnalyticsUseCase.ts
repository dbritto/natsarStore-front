import { Result } from '@shared/domain/Result';
import {
  AnalyticsPeriod,
  DashboardAnalyticsModel,
} from '../../domain/models/DashboardAnalytics.model';
import { WorkspaceRepositoryPort } from '../../domain/ports/WorkspaceRepositoryPort';

/**
 * Caso de Uso GetWorkspaceAnalyticsUseCase (Capa de Aplicación)
 * Consulta los indicadores y colecciones de los módulos del Swagger según la ventana de tiempo.
 */
export class GetWorkspaceAnalyticsUseCase {
  constructor(private readonly repository: WorkspaceRepositoryPort) {}

  public async execute(period: AnalyticsPeriod): Promise<Result<DashboardAnalyticsModel>> {
    return this.repository.getDashboardData(period);
  }
}
