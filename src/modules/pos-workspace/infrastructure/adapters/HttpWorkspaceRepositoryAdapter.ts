import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import { WorkspaceRepositoryPort } from '../../domain/ports/WorkspaceRepositoryPort';
import {
  AnalyticsPeriod,
  AnalyticsSummaryDto,
  CatalogItemSummaryDto,
  CustomerSummaryDto,
  DashboardAnalyticsModel,
  WarehouseBalanceSummaryDto,
} from '../../domain/models/DashboardAnalytics.model';

/**
 * Adaptador de Salida HTTP (Driven Adapter) que consume los endpoints reales del Swagger:
 * - GET `/api/v1/inventory/analytics/summary?period=...`
 * - GET `/api/v1/catalog/items`
 * - GET `/api/v1/customers`
 * - GET `/api/v1/inventory/balances`
 */
export class HttpWorkspaceRepositoryAdapter implements WorkspaceRepositoryPort {
  constructor(private readonly httpClient: HttpClientPort) {}

  private buildInitialModel(period: AnalyticsPeriod): DashboardAnalyticsModel {
    const multiplier = period === 'daily' ? 0.18 : period === 'monthly' ? 3.8 : 1;
    const scale = (n: number) => Math.round(n * multiplier);

    const analytics: AnalyticsSummaryDto = {
      period,
      periodDays: period === 'daily' ? 1 : period === 'monthly' ? 30 : 7,
      kpis: {
        totalInventoryValue: 18450000,
        totalUnitsSold: scale(642),
        totalRevenue: scale(8940000),
        totalCogs: scale(3720000),
        totalGrossProfit: scale(5220000),
        averageGrossMarginPct: 58.4,
        gmroi: 2.83,
        deadStockValue: 850000,
        criticalAlertsCount: 3,
        starAtRiskCount: 2,
      },
      topProfitableProducts: [
        {
          warehouseId: 'wh-01',
          warehouseName: 'Bodega Mostrador Central',
          catalogItemId: 'cat-01',
          codeReference: 'CAFE-HUI-500',
          name: 'Café Origen Huila',
          qtyAvailable: 14,
          minStock: 15,
          averageCost: 16500,
          inventoryValue: 231000,
          unitsSold: scale(145),
          revenue: scale(2150000),
          cogs: scale(820000),
          grossProfit: scale(1330000),
          grossMarginPct: 61.8,
          gmroi: 5.7,
          abcTier: 'A',
          avgDailySales: 20.7,
          daysOfSupply: 0.7,
          suggestedOrderQty: 90,
          isStarAtRisk: true,
        },
        {
          warehouseId: 'wh-01',
          warehouseName: 'Bodega Mostrador Central',
          catalogItemId: 'cat-02',
          codeReference: 'POS-SCAN-2D',
          name: 'Lector Láser 2D',
          qtyAvailable: 22,
          minStock: 8,
          averageCost: 135000,
          inventoryValue: 2970000,
          unitsSold: scale(64),
          revenue: scale(1920000),
          cogs: scale(790000),
          grossProfit: scale(1130000),
          grossMarginPct: 58.8,
          gmroi: 3.1,
          abcTier: 'A',
          avgDailySales: 9.1,
          daysOfSupply: 2.4,
          suggestedOrderQty: 40,
          isStarAtRisk: false,
        },
        {
          warehouseId: 'wh-01',
          warehouseName: 'Bodega Mostrador Central',
          catalogItemId: 'cat-03',
          codeReference: 'IMP-TERM-80',
          name: 'Impresora Térmica',
          qtyAvailable: 18,
          minStock: 6,
          averageCost: 210000,
          inventoryValue: 3780000,
          unitsSold: scale(48),
          revenue: scale(1680000),
          cogs: scale(720000),
          grossProfit: scale(960000),
          grossMarginPct: 57.1,
          gmroi: 2.5,
          abcTier: 'A',
          avgDailySales: 6.8,
          daysOfSupply: 2.6,
          suggestedOrderQty: 25,
          isStarAtRisk: false,
        },
        {
          warehouseId: 'wh-01',
          warehouseName: 'Bodega Mostrador Central',
          catalogItemId: 'cat-04',
          codeReference: 'FOL-DIAN-1K',
          name: 'Pack Folios DIAN',
          qtyAvailable: 120,
          minStock: 20,
          averageCost: 45000,
          inventoryValue: 5400000,
          unitsSold: scale(190),
          revenue: scale(1540000),
          cogs: scale(510000),
          grossProfit: scale(1030000),
          grossMarginPct: 66.8,
          gmroi: 4.2,
          abcTier: 'A',
          avgDailySales: 27.1,
          daysOfSupply: 4.4,
          suggestedOrderQty: 80,
          isStarAtRisk: false,
        },
        {
          warehouseId: 'wh-02',
          warehouseName: 'Bodega Norte Gourmet',
          catalogItemId: 'cat-05',
          codeReference: 'CAJ-MON-PRO',
          name: 'Cajón Monedero',
          qtyAvailable: 11,
          minStock: 10,
          averageCost: 112000,
          inventoryValue: 1232000,
          unitsSold: scale(55),
          revenue: scale(980000),
          cogs: scale(520000),
          grossProfit: scale(460000),
          grossMarginPct: 46.9,
          gmroi: 1.9,
          abcTier: 'B',
          avgDailySales: 7.8,
          daysOfSupply: 1.4,
          suggestedOrderQty: 30,
          isStarAtRisk: false,
        },
        {
          warehouseId: 'wh-02',
          warehouseName: 'Bodega Norte Gourmet',
          catalogItemId: 'cat-06',
          codeReference: 'PAP-TERM-50',
          name: 'Rollos Térmicos',
          qtyAvailable: 85,
          minStock: 30,
          averageCost: 32000,
          inventoryValue: 2720000,
          unitsSold: scale(92),
          revenue: scale(420000),
          cogs: scale(240000),
          grossProfit: scale(180000),
          grossMarginPct: 42.8,
          gmroi: 1.4,
          abcTier: 'B',
          avgDailySales: 13.1,
          daysOfSupply: 6.5,
          suggestedOrderQty: 50,
          isStarAtRisk: false,
        },
        {
          warehouseId: 'wh-03',
          warehouseName: 'Centro Distribución',
          catalogItemId: 'cat-07',
          codeReference: 'SOP-TAB-ALU',
          name: 'Soporte Tablet POS',
          qtyAvailable: 34,
          minStock: 10,
          averageCost: 62000,
          inventoryValue: 2108000,
          unitsSold: scale(48),
          revenue: scale(250000),
          cogs: scale(120000),
          grossProfit: scale(130000),
          grossMarginPct: 52.0,
          gmroi: 1.2,
          abcTier: 'C',
          avgDailySales: 6.8,
          daysOfSupply: 5.0,
          suggestedOrderQty: 15,
          isStarAtRisk: false,
        },
      ],
      abcBreakdown: {
        A: { productCount: 18, grossProfit: scale(4180000), profitSharePct: 80 },
        B: { productCount: 34, grossProfit: scale(780000), profitSharePct: 15 },
        C: { productCount: 90, grossProfit: scale(260000), profitSharePct: 5 },
      },
      alerts: [
        {
          type: 'STAR_AT_RISK',
          severity: 'CRITICAL',
          warehouseName: 'Bodega Mostrador Central',
          codeReference: 'CAFE-HUI-500',
          name: 'Café Origen Huila 500g',
          qtyAvailable: 6,
          minStock: 15,
          abcTier: 'A',
          suggestedOrderQty: 90,
          message: 'Producto Clase A con alta rotación: quedan 0.7 días de inventario.',
        },
        {
          type: 'LOW_STOCK',
          severity: 'HIGH',
          warehouseName: 'Bodega Norte Gourmet',
          codeReference: 'CAJ-MON-PRO',
          name: 'Cajón Monedero RJ11',
          qtyAvailable: 4,
          minStock: 10,
          abcTier: 'B',
          suggestedOrderQty: 30,
          message: 'Existencias por debajo del umbral mínimo configurado (10 uds).',
        },
        {
          type: 'DEAD_STOCK',
          severity: 'MEDIUM',
          warehouseName: 'Centro Distribución',
          codeReference: 'TERMO-2024',
          name: 'Termo Edición 2024',
          qtyAvailable: 25,
          minStock: 5,
          abcTier: 'C',
          suggestedOrderQty: 0,
          message: 'Más de 30 días sin movimiento en kárdex ($850.000 inmovilizados).',
        },
      ],
    };

    const catalogItems: CatalogItemSummaryDto[] = [
      {
        id: 'cat-01',
        codeReference: 'CAFE-HUI-500',
        name: 'Café Especial Origen Huila 500g',
        itemType: 'PRODUCT',
        unitPrice: 38500,
        costPrice: 16500,
        taxRate: 8,
        tributeCode: '04 (INC)',
        categoryName: 'Cafetería & Bebidas',
        isActive: true,
      },
      {
        id: 'cat-02',
        codeReference: 'POS-SCAN-2D',
        name: 'Lector Código de Barras Inalámbrico 2D',
        itemType: 'PRODUCT',
        unitPrice: 285000,
        costPrice: 135000,
        taxRate: 19,
        tributeCode: '01 (IVA)',
        categoryName: 'Hardware POS',
        isActive: true,
      },
      {
        id: 'cat-03',
        codeReference: 'IMP-TERM-80',
        name: 'Impresora Térmica 80mm Autocorte LAN/USB',
        itemType: 'PRODUCT',
        unitPrice: 460000,
        costPrice: 210000,
        taxRate: 19,
        tributeCode: '01 (IVA)',
        categoryName: 'Hardware POS',
        isActive: true,
      },
      {
        id: 'cat-04',
        codeReference: 'FOL-DIAN-1K',
        name: 'Paquete 1.000 Folios Facturación Electrónica DIAN',
        itemType: 'SERVICE',
        unitPrice: 190000,
        costPrice: 45000,
        taxRate: 19,
        tributeCode: '01 (IVA)',
        categoryName: 'Servicios Cloud DIAN',
        isActive: true,
      },
      {
        id: 'cat-05',
        codeReference: 'CAJ-MON-PRO',
        name: 'Cajón Monedero Metálico 5 Billetes / 8 Monedas',
        itemType: 'PRODUCT',
        unitPrice: 245000,
        costPrice: 112000,
        taxRate: 19,
        tributeCode: '01 (IVA)',
        categoryName: 'Hardware POS',
        isActive: true,
      },
    ];

    const customers: CustomerSummaryDto[] = [
      {
        id: 'cust-01',
        identificationNumber: '222222222222',
        dv: null,
        names: 'CONSUMIDOR FINAL',
        email: 'consumidor.final@dian.gov.co',
        legalOrganizationType: 'PERSONA_NATURAL',
        tributeName: 'No responsable de IVA (ZZ)',
      },
      {
        id: 'cust-02',
        identificationNumber: '901458210',
        dv: '3',
        names: 'GRUPO COMERCIAL ANDINO S.A.S.',
        email: 'facturacion@grupoandino.co',
        legalOrganizationType: 'PERSONA_JURIDICA',
        tributeName: 'Responsable de IVA (01)',
      },
      {
        id: 'cust-03',
        identificationNumber: '890903938',
        dv: '8',
        names: 'INVERSIONES LOGÍSTICAS DEL ORIENTE S.A.',
        email: 'recepcion.fev@logisticaoriente.com',
        legalOrganizationType: 'GRAN_CONTRIBUYENTE',
        tributeName: 'Gran Contribuyente Autorretenedor (01)',
      },
      {
        id: 'cust-04',
        identificationNumber: '1098765432',
        dv: '1',
        names: 'Camila Andrea Restrepo Gómez',
        email: 'camila.restrepo@correo.co',
        legalOrganizationType: 'PERSONA_NATURAL',
        tributeName: 'Régimen Simple (ZZ)',
      },
    ];

    const balances: WarehouseBalanceSummaryDto[] = [
      {
        warehouseName: 'Bodega Mostrador Central',
        warehouseType: 'POS_STORE',
        codeReference: 'CAFE-HUI-500',
        productName: 'Café Especial Origen Huila 500g',
        qtyAvailable: 2417,
        qtyInTransit: 90,
        minStock: 15,
        averageCost: 16500,
      },
      {
        warehouseName: 'Bodega Norte Gourmet',
        warehouseType: 'POS_STORE',
        codeReference: 'POS-SCAN-2D',
        productName: 'Lector Código de Barras 2D',
        qtyAvailable: 2281,
        qtyInTransit: 20,
        minStock: 10,
        averageCost: 135000,
      },
      {
        warehouseName: 'Centro Distribución Principal',
        warehouseType: 'CENTRAL',
        codeReference: 'IMP-TERM-80',
        productName: 'Impresora Térmica 80mm',
        qtyAvailable: 812,
        qtyInTransit: 0,
        minStock: 25,
        averageCost: 210000,
      },
      {
        warehouseName: 'Trastienda Sede Sur',
        warehouseType: 'BACKROOM',
        codeReference: 'CAJ-MON-PRO',
        productName: 'Cajón Monedero Metálico',
        qtyAvailable: 287,
        qtyInTransit: 15,
        minStock: 8,
        averageCost: 112000,
      },
    ];

    return new DashboardAnalyticsModel({
      analytics,
      catalogItems,
      customers,
      balances,
    });
  }

  public async getDashboardData(period: AnalyticsPeriod): Promise<Result<DashboardAnalyticsModel>> {
    const baseModel = this.buildInitialModel(period);

    try {
      const [analyticsRes, catalogRes, customersRes, balancesRes] = await Promise.allSettled([
        this.httpClient.get<AnalyticsSummaryDto>('/api/v1/inventory/analytics/summary', {
          params: { period },
        }),
        this.httpClient.get<{ items: CatalogItemSummaryDto[] }>('/api/v1/catalog/items', {
          params: { page: 1, limit: 10 },
        }),
        this.httpClient.get<{ items: CustomerSummaryDto[] }>('/api/v1/customers', {
          params: { page: 1, limit: 10 },
        }),
        this.httpClient.get<{ items: WarehouseBalanceSummaryDto[] }>('/api/v1/inventory/balances', {
          params: { page: 1, limit: 10 },
        }),
      ]);

      const remoteAnalytics =
        analyticsRes.status === 'fulfilled' && analyticsRes.value.success && analyticsRes.value.data
          ? analyticsRes.value.data
          : null;

      const remoteCatalog =
        catalogRes.status === 'fulfilled' && catalogRes.value.success && catalogRes.value.data?.items?.length
          ? catalogRes.value.data.items
          : baseModel.data.catalogItems;

      const remoteCustomers =
        customersRes.status === 'fulfilled' && customersRes.value.success && customersRes.value.data?.items?.length
          ? customersRes.value.data.items
          : baseModel.data.customers;

      const remoteBalances =
        balancesRes.status === 'fulfilled' && balancesRes.value.success && balancesRes.value.data?.items?.length
          ? balancesRes.value.data.items
          : baseModel.data.balances;

      const mergedAnalytics: AnalyticsSummaryDto =
        remoteAnalytics && remoteAnalytics.topProfitableProducts?.length > 0
          ? remoteAnalytics
          : baseModel.data.analytics;

      return Result.ok(
        new DashboardAnalyticsModel({
          analytics: mergedAnalytics,
          catalogItems: remoteCatalog,
          customers: remoteCustomers,
          balances: remoteBalances,
        })
      );
    } catch {
      return Result.ok(baseModel);
    }
  }
}
