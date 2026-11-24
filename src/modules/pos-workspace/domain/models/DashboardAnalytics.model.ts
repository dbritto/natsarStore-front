import { MoneyCop } from '../value-objects/MoneyCop.vo';
import {
  BarChartDataPoint,
  BubbleSegmentItem,
  RadialBreakdownRow,
} from '@shared/components';

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export interface TopProductMetricDto {
  warehouseId: string;
  warehouseName: string;
  catalogItemId: string;
  codeReference: string;
  name: string;
  qtyAvailable: number;
  minStock: number | null;
  averageCost: number;
  inventoryValue: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  gmroi: number;
  abcTier: 'A' | 'B' | 'C';
  avgDailySales: number;
  daysOfSupply: number | null;
  suggestedOrderQty: number;
  isStarAtRisk: boolean;
}

export interface InventoryAlertDto {
  type: 'STAR_AT_RISK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DEAD_STOCK';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  warehouseName: string;
  codeReference: string;
  name: string;
  qtyAvailable: number;
  minStock: number | null;
  abcTier: 'A' | 'B' | 'C';
  suggestedOrderQty: number;
  message: string;
}

export interface AbcTierSummaryDto {
  productCount: number;
  grossProfit: number;
  profitSharePct: number;
}

export interface AnalyticsSummaryDto {
  period: AnalyticsPeriod;
  periodDays: number;
  kpis: {
    totalInventoryValue: number;
    totalUnitsSold: number;
    totalRevenue: number;
    totalCogs: number;
    totalGrossProfit: number;
    averageGrossMarginPct: number;
    gmroi: number;
    deadStockValue: number;
    criticalAlertsCount: number;
    starAtRiskCount: number;
  };
  topProfitableProducts: TopProductMetricDto[];
  abcBreakdown: {
    A: AbcTierSummaryDto;
    B: AbcTierSummaryDto;
    C: AbcTierSummaryDto;
  };
  alerts: InventoryAlertDto[];
}

export interface CatalogItemSummaryDto {
  id: string;
  codeReference: string;
  name: string;
  itemType: string;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  tributeCode: string;
  categoryName: string;
  isActive: boolean;
}

export interface CustomerSummaryDto {
  id: string;
  identificationNumber: string;
  dv: string | null;
  names: string;
  email: string;
  legalOrganizationType: string;
  tributeName: string;
}

export interface WarehouseBalanceSummaryDto {
  warehouseName: string;
  warehouseType: string;
  codeReference: string;
  productName: string;
  qtyAvailable: number;
  qtyInTransit: number;
  minStock: number | null;
  averageCost: number;
}

export interface SwaggerModuleCollectionDto {
  analytics: AnalyticsSummaryDto;
  catalogItems: CatalogItemSummaryDto[];
  customers: CustomerSummaryDto[];
  balances: WarehouseBalanceSummaryDto[];
}

/**
 * Modelo Rico de Dominio DashboardAnalyticsModel (DDD - Diseño en Modelos)
 * Transforma los datos de los endpoints del Swagger (`/api/v1/inventory/analytics/summary`,
 * `/api/v1/catalog/items`, `/api/v1/customers`, `/api/v1/inventory/balances`) en estructuras
 * listas para los organismos visuales de Atomic Design.
 */
export class DashboardAnalyticsModel {
  public readonly data: Readonly<SwaggerModuleCollectionDto>;

  constructor(data: SwaggerModuleCollectionDto) {
    this.data = Object.freeze(data);
  }

  public get formattedRevenue(): string {
    return MoneyCop.fromNumber(this.data.analytics.kpis.totalRevenue).format();
  }

  public get formattedGrossProfit(): string {
    return MoneyCop.fromNumber(this.data.analytics.kpis.totalGrossProfit).format();
  }

  public get formattedInventoryValue(): string {
    return MoneyCop.fromNumber(this.data.analytics.kpis.totalInventoryValue).format();
  }

  public get formattedDeadStock(): string {
    return MoneyCop.fromNumber(this.data.analytics.kpis.deadStockValue).format();
  }

  public toBarChartPoints(): BarChartDataPoint[] {
    return this.data.analytics.topProfitableProducts.slice(0, 7).map((prod) => ({
      label: prod.name.split(' ').slice(0, 2).join(' '),
      primaryValue: prod.grossProfit,
      secondaryValue: prod.revenue,
      primaryFormatted: MoneyCop.fromNumber(prod.grossProfit).format(),
      secondaryFormatted: MoneyCop.fromNumber(prod.revenue).format(),
    }));
  }

  public toAbcRadialRows(): RadialBreakdownRow[] {
    const { A, B, C } = this.data.analytics.abcBreakdown;
    return [
      {
        label: `Clase A (${A.productCount} SKUs)`,
        value: MoneyCop.fromNumber(A.grossProfit).format(),
        trendValue: `+${A.profitSharePct}%`,
        trendDirection: 'up',
        color: '#4D53F4',
        pct: Math.max(25, A.profitSharePct),
        icon: 'sparkles',
      },
      {
        label: `Clase B (${B.productCount} SKUs)`,
        value: MoneyCop.fromNumber(B.grossProfit).format(),
        trendValue: `+${B.profitSharePct}%`,
        trendDirection: 'up',
        color: '#3730A3',
        pct: Math.max(20, B.profitSharePct * 3),
        icon: 'package',
      },
      {
        label: `Clase C (${C.productCount} SKUs)`,
        value: MoneyCop.fromNumber(C.grossProfit).format(),
        trendValue: `-${C.profitSharePct}%`,
        trendDirection: 'down',
        color: '#EF4444',
        pct: Math.max(15, C.profitSharePct * 5),
        icon: 'layers',
      },
    ];
  }

  public toWarehouseBubbleSegments(): BubbleSegmentItem[] {
    const grouped = new Map<string, number>();
    for (const bal of this.data.balances) {
      grouped.set(bal.warehouseName, (grouped.get(bal.warehouseName) ?? 0) + bal.qtyAvailable);
    }

    const entries = Array.from(grouped.entries());
    const maxUnits = Math.max(1, ...entries.map(([, u]) => u));
    const icons = ['🏬', '📦', '🚚', '🧾'];

    return entries.slice(0, 4).map(([name, units], idx) => ({
      label: name,
      count: `${units.toLocaleString('es-CO')} uds`,
      progressPct: Math.round((units / maxUnits) * 100),
      badgeIcon: icons[idx % icons.length],
    }));
  }
}
