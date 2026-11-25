import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  BubbleGrowthCard,
  Button,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  PeriodOption,
  RadialMultiRingCard,
  RoundedBarChartCard,
  StatMetricCard,
  TrendPill,
  Typography,
  WorkspaceSectionId,
  WorkspaceShellTemplate,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';
import {
  CustomerRegimeType,
  DianTaxType,
} from '../../domain/models/TaxSettlement.model';
import {
  AnalyticsPeriod,
  DashboardAnalyticsModel,
} from '../../domain/models/DashboardAnalytics.model';
import { SimulatePosCheckoutUseCase } from '../../application/use-cases/SimulatePosCheckoutUseCase';
import { GetWorkspaceAnalyticsUseCase } from '../../application/use-cases/GetWorkspaceAnalyticsUseCase';
import { CatalogUseCases } from '@modules/catalog/application/use-cases/CatalogUseCases';
import { CatalogModuleView } from '@modules/catalog/infrastructure/ui/CatalogModuleView';
import { InventoryUseCases } from '@modules/inventory/application/use-cases/InventoryUseCases';
import { InventoryModuleView } from '@modules/inventory/infrastructure/ui/InventoryModuleView';
import { LogisticsUseCases } from '@modules/logistics/application/use-cases/LogisticsUseCases';
import { LogisticsModuleView } from '@modules/logistics/infrastructure/ui/LogisticsModuleView';
import { CustomerUseCases } from '@modules/customers/application/use-cases/CustomerUseCases';
import { CustomersModuleView } from '@modules/customers/infrastructure/ui/CustomersModuleView';
import { RbacUseCases } from '@modules/rbac/application/use-cases/RbacUseCases';
import { RbacModuleView } from '@modules/rbac/infrastructure/ui/RbacModuleView';
import { EstablishmentUseCases } from '@modules/establishments/application/use-cases/EstablishmentUseCases';
import { EstablishmentsModuleView } from '@modules/establishments/infrastructure/ui/EstablishmentsModuleView';
import { SettingsUseCases } from '@modules/settings/application/use-cases/SettingsUseCases';
import { SettingsModuleView } from '@modules/settings/infrastructure/ui/SettingsModuleView';
import { PosTerminalUseCases } from '@modules/pos-terminal/application/use-cases/PosTerminalUseCases';
import { PosTerminalModuleView } from '@modules/pos-terminal/infrastructure/ui/PosTerminalModuleView';
import { UserProfileModuleView } from '@modules/auth/infrastructure/ui/UserProfileModuleView';

export interface PosWorkspacePageProps {
  session: UserSession;
  sessionRemainingSeconds: number;
  autoRefreshEnabled: boolean;
  isRefreshingToken: boolean;
  analyticsUseCase: GetWorkspaceAnalyticsUseCase;
  catalogUseCases: CatalogUseCases;
  inventoryUseCases: InventoryUseCases;
  logisticsUseCases: LogisticsUseCases;
  customerUseCases: CustomerUseCases;
  rbacUseCases: RbacUseCases;
  establishmentUseCases: EstablishmentUseCases;
  settingsUseCases: SettingsUseCases;
  posTerminalUseCases: PosTerminalUseCases;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onRefreshSessionToken: () => Promise<boolean>;
  onSimulateExpirationCountdown: (seconds: number) => void;
  onUpdateSession: (updatedSession: UserSession) => void;
  onLogout: () => void;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'daily', label: 'Hoy' },
  { value: 'weekly', label: 'Esta semana' },
  { value: 'monthly', label: 'Este mes' },
];

const SECTION_TITLES: Record<WorkspaceSectionId, string> = {
  dashboard: 'Reporte de Ventas & Analítica',
  'pos-terminal': 'Terminal Caja Registradora POS & Facturación DIAN',
  catalog: 'Catálogo de Productos & Códigos de Barras',
  customers: 'Clientes Adquirentes & Motor Tributario DIAN',
  inventory: 'Existencias por Bodega & Kárdex Inmutable',
  logistics: 'Traslados entre Bodegas & Tomas Físicas',
  establishments: 'Sedes & Establecimientos POS',
  rbac: 'Usuarios, Roles & Permisos RBAC',
  settings: 'Configuración Global & Multimedia',
  profile: 'Mi Perfil & Actualización de Datos',
};

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo POS Workspace)
 * Implementa el diseño Bento Grid estilo DealDeck utilizando únicamente `@shared/components`.
 */
export const PosWorkspacePage: React.FC<PosWorkspacePageProps> = ({
  session,
  sessionRemainingSeconds,
  autoRefreshEnabled,
  isRefreshingToken,
  analyticsUseCase,
  catalogUseCases,
  inventoryUseCases,
  logisticsUseCases,
  customerUseCases,
  rbacUseCases,
  establishmentUseCases,
  settingsUseCases,
  posTerminalUseCases,
  onToggleAutoRefresh,
  onRefreshSessionToken,
  onSimulateExpirationCountdown,
  onUpdateSession,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<WorkspaceSectionId>('dashboard');
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const [model, setModel] = useState<DashboardAnalyticsModel | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [modalNotice, setModalNotice] = useState<FriendlyNotice | null>(null);

  // Estado del simulador tributario (Módulo Clientes / DIAN)
  const simulateTaxUseCase = useMemo(() => new SimulatePosCheckoutUseCase(), []);
  const [rawNit, setRawNit] = useState('901458210');
  const [regime, setRegime] = useState<CustomerRegimeType>('PERSONA_JURIDICA');
  const [baseAmount, setBaseAmount] = useState('285000');
  const [taxType, setTaxType] = useState<DianTaxType>('IVA_19');

  const loadAnalytics = async (targetPeriod: AnalyticsPeriod) => {
    const res = await analyticsUseCase.execute(targetPeriod);
    if (res.isSuccess) {
      setModel(res.getValue());
    }
  };

  useEffect(() => {
    void loadAnalytics(period);
  }, [period]);

  const taxSimulationResult = useMemo(() => {
    return simulateTaxUseCase.execute({
      rawNit,
      regime,
      baseAmountCop: Number(baseAmount),
      taxType,
    });
  }, [simulateTaxUseCase, rawNit, regime, baseAmount, taxType]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  if (!model) {
    return null;
  }

  const { analytics, catalogItems, customers, balances } = model.data;

  const renderDashboardBento = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 0.95fr)',
        gap: '22px',
        alignItems: 'stretch',
      }}
    >
      {/* Columna Izquierda/Central: 2x2 KPIs arriba + Gráfico de Barras Redondeadas abajo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '20px',
          }}
        >
          {/* Tarjeta 1: Destacada en Azul Eléctrico (#4D53F4) */}
          <StatMetricCard
            featured
            title="Ventas Totales"
            value={model.formattedRevenue}
            trendValue="+12,4%"
            trendDirection="up"
            comparisonLine1="Facturado vs"
            comparisonLine2="periodo anterior"
            icon="receipt"
          />

          {/* Tarjeta 2: Blanca Limpia */}
          <StatMetricCard
            title="Utilidad Bruta"
            value={model.formattedGrossProfit}
            trendValue={`+${analytics.kpis.averageGrossMarginPct}%`}
            trendDirection="up"
            comparisonLine1="Margen bruto"
            comparisonLine2="del periodo"
            icon="bar-chart"
          />

          {/* Tarjeta 3: Blanca con Píldora Roja para Alertas/Stock Muerto */}
          <StatMetricCard
            title="Stock en Riesgo / Muerto"
            value={model.formattedDeadStock}
            trendValue={`-${analytics.kpis.criticalAlertsCount} Alertas`}
            trendDirection="down"
            comparisonLine1="Productos con"
            comparisonLine2="alerta de stock"
            icon="alert"
          />

          {/* Tarjeta 4: Blanca con Píldora Verde */}
          <StatMetricCard
            title="Productos Vendidos"
            value={analytics.kpis.totalUnitsSold.toLocaleString('es-CO')}
            trendValue="+12,1%"
            trendDirection="up"
            comparisonLine1="Unidades vs"
            comparisonLine2="periodo anterior"
            icon="truck"
          />
        </div>

        {/* Gráfico Inferior: Barras Dobles Redondeadas (Ingresos vs Utilidad Bruta) */}
        <RoundedBarChartCard
          title="Rentabilidad & Rotación por Producto"
          subtitle="Comparativa de ingresos facturados vs utilidad bruta (/api/v1/inventory/analytics/summary)"
          secondaryLegend="Ingresos Facturados"
          primaryLegend="Utilidad Bruta"
          period={period}
          periodOptions={PERIOD_OPTIONS}
          onPeriodChange={(val) => setPeriod(val as AnalyticsPeriod)}
          data={model.toBarChartPoints()}
        />
      </div>

      {/* Columna Derecha: Anillos Concéntricos ABC arriba + Burbujas de Bodegas abajo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <RadialMultiRingCard
          title="Estadística de Productos"
          subtitle="Clasificación ABC por margen bruto"
          centerMetricValue={analytics.kpis.totalUnitsSold.toLocaleString('es-CO')}
          centerMetricLabel="Unidades Vendidas"
          centerTrendValue="+5,34%"
          period={period}
          periodOptions={PERIOD_OPTIONS}
          onPeriodChange={(val) => setPeriod(val as AnalyticsPeriod)}
          rows={model.toAbcRadialRows()}
        />

        <BubbleGrowthCard
          title="Distribución por Bodegas"
          subtitle="Unidades disponibles por sede (/api/v1/inventory/balances)"
          period={period}
          periodOptions={PERIOD_OPTIONS}
          onPeriodChange={(val) => setPeriod(val as AnalyticsPeriod)}
          items={model.toWarehouseBubbleSegments()}
        />
      </div>
    </div>
  );

  const renderCustomersAndTaxSection = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(340px, 1fr)',
        gap: '22px',
      }}
    >
      {/* Listado de Adquirentes DIAN */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <Typography as="h2" variant="h2">
            Adquirentes Registrados (`/api/v1/customers`)
          </Typography>
          <Typography variant="caption" tone="muted">
            Selecciona un cliente para cargar su NIT y régimen en el motor de liquidación tributaria
          </Typography>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {customers.map((cust) => (
            <div
              key={cust.id}
              onClick={() => {
                setRawNit(cust.identificationNumber);
                if (cust.identificationNumber === '222222222222') {
                  setRegime('CONSUMIDOR_FINAL');
                } else if (cust.legalOrganizationType === 'GRAN_CONTRIBUYENTE') {
                  setRegime('GRAN_CONTRIBUYENTE');
                } else {
                  setRegime('PERSONA_JURIDICA');
                }
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor: rawNit === cust.identificationNumber ? '#EEF2FF' : '#F8FAFC',
                border:
                  rawNit === cust.identificationNumber
                    ? '1.5px solid #4D53F4'
                    : '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                  {cust.names}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                  NIT/Doc: <strong>{cust.identificationNumber}{cust.dv ? `-${cust.dv}` : ''}</strong> • {cust.email}
                </div>
              </div>
              <Badge tone="brand">{cust.tributeName}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Motor de Liquidación Tributaria (/api/v1/customers/calculate-taxes) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography as="h2" variant="h2">
            Motor Tributario DIAN (`/calculate-taxes`)
          </Typography>
          <Badge tone="brand">Módulo 11 DV</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField
            label="NIT / Documento"
            value={rawNit}
            onChange={(e) => setRawNit(e.target.value)}
          />
          <FormField
            type="number"
            label="Subtotal Base (COP)"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'IVA_19', label: 'IVA 19%' },
              { id: 'INC_8', label: 'INC 8% (Restaurantes/Café)' },
              { id: 'IVA_5', label: 'IVA 5%' },
              { id: 'EXENTO_0', label: 'Exento 0%' },
            ] as const
          ).map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={taxType === t.id ? 'primary' : 'outline'}
              onClick={() => setTaxType(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <Divider margin="4px 0" />

        {taxSimulationResult.isFailure ? (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              padding: '18px',
              border: '1px dashed #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '0.83rem', color: '#64748B' }}>
              Completa un NIT válido y un subtotal mayor a cero para calcular la liquidación.
            </span>
            <Button
              type="button"
              size="sm"
              variant="subtle"
              onClick={() =>
                setModalNotice(
                  FriendlyErrorMapper.toFriendlyNotice(
                    taxSimulationResult.error!,
                    'Revisa los datos para el cálculo'
                  )
                )
              }
            >
              Ver detalle
            </Button>
          </div>
        ) : (
          (() => {
            const s = taxSimulationResult.getValue().props;
            return (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748B' }}>NIT con Dígito de Verificación:</span>
                  <strong style={{ color: '#4D53F4' }}>{s.customerNit.formatted}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748B' }}>Subtotal Gravable:</span>
                  <strong>{s.subtotal.format()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748B' }}>Impuesto ({s.taxRatePercent}%):</span>
                  <strong style={{ color: '#047857' }}>+ {s.taxAmount.format()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748B' }}>ReteFuente (2.5%):</span>
                  <strong style={{ color: '#B45309' }}>- {s.withholdingAmount.format()}</strong>
                </div>
                <Divider margin="4px 0" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Total Neto Factura:</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: '#4D53F4' }}>
                    {s.totalPayable.format()}
                  </span>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );

  const renderInventoryAndAlertsSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Alertas Críticas (/api/v1/inventory/alerts) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography as="h2" variant="h2">
            Alertas Accionables de Reabastecimiento (`/api/v1/inventory/alerts`)
          </Typography>
          <TrendPill value={`${analytics.alerts.length} Alertas Activas`} direction="down" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {analytics.alerts.map((al) => (
            <div
              key={`${al.codeReference}-${al.warehouseName}`}
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: al.severity === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${al.severity === 'CRITICAL' ? '#FECACA' : '#FDE68A'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{al.name}</strong>
                <Badge tone={al.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                  Clase {al.abcTier} • {al.severity}
                </Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>{al.message}</p>
              <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Bodega: <strong>{al.warehouseName}</strong></span>
                <span>Sugerido pedir: <strong>{al.suggestedOrderQty} uds</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saldos por Bodega (/api/v1/inventory/balances) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <Typography as="h2" variant="h2">
          Saldos de Inventario & Costo Promedio Ponderado (`/api/v1/inventory/balances`)
        </Typography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {balances.map((bal) => (
            <div
              key={`${bal.warehouseName}-${bal.codeReference}`}
              style={{
                padding: '14px 18px',
                borderRadius: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  {bal.warehouseName} ({bal.warehouseType})
                </div>
                <div style={{ fontSize: '0.77rem', color: '#64748B' }}>
                  SKU: {bal.codeReference} — {bal.productName}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                  En tránsito: <strong>{bal.qtyInTransit} uds</strong>
                </span>
                <TrendPill value={`${bal.qtyAvailable.toLocaleString('es-CO')} disponibles`} direction="up" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSwaggerModuleOverview = (
    moduleTitle: string,
    description: string,
    endpoints: { method: string; path: string; summary: string }[]
  ) => (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '26px',
        boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div>
        <Typography as="h2" variant="h2">
          {moduleTitle}
        </Typography>
        <Typography variant="caption" tone="muted">
          {description}
        </Typography>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {endpoints.map((ep) => (
          <div
            key={`${ep.method}-${ep.path}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Badge
                tone={
                  ep.method === 'GET'
                    ? 'brand'
                    : ep.method === 'POST'
                      ? 'success'
                      : ep.method === 'DELETE'
                        ? 'danger'
                        : 'warning'
                }
              >
                {ep.method}
              </Badge>
              <code style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{ep.path}</code>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{ep.summary}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardBento();
      case 'pos-terminal':
        return (
          <PosTerminalModuleView
            cashierFullName={session.fullName}
            posTerminalUseCases={posTerminalUseCases}
            catalogUseCases={catalogUseCases}
            customerUseCases={customerUseCases}
          />
        );
      case 'catalog':
        return <CatalogModuleView catalogUseCases={catalogUseCases} />;
      case 'customers':
        return <CustomersModuleView customerUseCases={customerUseCases} />;
      case 'inventory':
        return <InventoryModuleView inventoryUseCases={inventoryUseCases} />;
      case 'logistics':
        return <LogisticsModuleView logisticsUseCases={logisticsUseCases} />;
      case 'establishments':
        return <EstablishmentsModuleView establishmentUseCases={establishmentUseCases} />;
      case 'rbac':
        return <RbacModuleView currentUserId={session.id} rbacUseCases={rbacUseCases} />;
      case 'settings':
        return <SettingsModuleView settingsUseCases={settingsUseCases} />;
      case 'profile':
        return (
          <UserProfileModuleView
            session={session}
            rbacUseCases={rbacUseCases}
            sessionRemainingSeconds={sessionRemainingSeconds}
            autoRefreshEnabled={autoRefreshEnabled}
            isRefreshingToken={isRefreshingToken}
            onToggleAutoRefresh={onToggleAutoRefresh}
            onRefreshSessionToken={onRefreshSessionToken}
            onSimulateExpirationCountdown={onSimulateExpirationCountdown}
            onUpdateSession={onUpdateSession}
            onLogout={onLogout}
          />
        );
    }
  };

  const docTypeLabel =
    session.identificationTypeCode === '31'
      ? 'NIT'
      : session.identificationTypeCode === '22'
      ? 'CE'
      : session.identificationTypeCode === '41'
      ? 'PAS'
      : 'CC';

  return (
    <WorkspaceShellTemplate
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      pageTitle={SECTION_TITLES[activeSection]}
      dateSubtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
      userFullName={session.fullName}
      userRoleLabel={session.primaryRoleLabel}
      userEmail={session.email}
      userIdentification={`${docTypeLabel} ${session.identificationNumber}`}
      userEstablishment={session.establishmentName}
      userRoles={session.roles}
      userPermissions={session.permissions}
      userPhotoUrl={session.photoUrl}
      sessionRemainingSeconds={sessionRemainingSeconds}
      isRefreshingToken={isRefreshingToken}
      alertCount={analytics.kpis.criticalAlertsCount}
      onRefresh={() => void loadAnalytics(period)}
      onSearchClick={() => setActiveSection('catalog')}
      onRefreshSessionToken={() => void onRefreshSessionToken()}
      onOpenProfileSettings={() => setActiveSection('profile')}
      onLogout={onLogout}
    >
      {renderActiveContent()}

      <FriendlyModal
        isOpen={Boolean(modalNotice)}
        title={modalNotice?.title ?? ''}
        message={modalNotice?.message ?? ''}
        tone={modalNotice?.tone}
        actionLabel={modalNotice?.actionLabel}
        onClose={() => setModalNotice(null)}
      />
    </WorkspaceShellTemplate>
  );
};
