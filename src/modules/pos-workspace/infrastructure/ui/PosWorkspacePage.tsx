import React, { useMemo, useState } from 'react';
import {
  AlertBanner,
  Badge,
  Button,
  Divider,
  FormField,
  Icon,
  StatMetricCard,
  Typography,
  WorkspaceShellTemplate,
} from '@shared/components';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';
import {
  CustomerRegimeType,
  DianTaxType,
} from '../../domain/models/TaxSettlement.model';
import { SimulatePosCheckoutUseCase } from '../../application/use-cases/SimulatePosCheckoutUseCase';

export interface PosWorkspacePageProps {
  session: UserSession;
  onLogout: () => void;
}

const SAMPLE_POS_PRODUCTS = [
  {
    id: 'PRD-001',
    sku: '77012345001',
    name: 'Café Especial Origen Huila 500g',
    category: 'Cafetería & Bebidas',
    priceCop: 38500,
    taxType: 'INC_8' as DianTaxType,
    taxLabel: 'INC 8%',
    stock: 42,
  },
  {
    id: 'PRD-002',
    sku: '77012345002',
    name: 'Terminal Lector Código de Barras 2D',
    category: 'Hardware POS',
    priceCop: 285000,
    taxType: 'IVA_19' as DianTaxType,
    taxLabel: 'IVA 19%',
    stock: 15,
  },
  {
    id: 'PRD-003',
    sku: '77012345003',
    name: 'Suscripción Folios Electrónicos DIAN (1.000)',
    category: 'Servicios Cloud',
    priceCop: 190000,
    taxType: 'IVA_19' as DianTaxType,
    taxLabel: 'IVA 19%',
    stock: 999,
  },
  {
    id: 'PRD-004',
    sku: '77012345004',
    name: 'Canasta Básica Orgánica Certificada',
    category: 'Alimentos',
    priceCop: 64000,
    taxType: 'IVA_5' as DianTaxType,
    taxLabel: 'IVA 5%',
    stock: 27,
  },
];

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo POS Workspace)
 * Construido 100% con los componentes de `@shared/components` (Atomic Design).
 */
export const PosWorkspacePage: React.FC<PosWorkspacePageProps> = ({
  session,
  onLogout,
}) => {
  const simulateUseCase = useMemo(() => new SimulatePosCheckoutUseCase(), []);

  const [rawNit, setRawNit] = useState('901458210');
  const [regime, setRegime] = useState<CustomerRegimeType>('PERSONA_JURIDICA');
  const [baseAmount, setBaseAmount] = useState('285000');
  const [taxType, setTaxType] = useState<DianTaxType>('IVA_19');

  const simulationResult = useMemo(() => {
    return simulateUseCase.execute({
      rawNit,
      regime,
      baseAmountCop: Number(baseAmount),
      taxType,
    });
  }, [simulateUseCase, rawNit, regime, baseAmount, taxType]);

  return (
    <WorkspaceShellTemplate
      userFullName={session.fullName}
      userEmail={session.email}
      primaryRole={session.primaryRoleLabel}
      isSuperAdmin={session.isSuperAdmin}
      onLogout={onLogout}
    >
      {/* Encabezado Ejecutivo del Workspace */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Typography as="h1" variant="h1">
              Panel Operativo NatsarStore
            </Typography>
            <Badge tone="success" dot>
              Conectado
            </Badge>
          </div>
          <Typography variant="body" tone="secondary">
            Gestión de ventas, catálogo comercial y liquidación tributaria
          </Typography>
        </div>
      </div>

      {/* Fila de KPIs usando la molécula compartida StatMetricCard */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        <StatMetricCard
          title="Ventas Turno Actual"
          value="$ 4.820.000"
          badgeText="+14.2% hoy"
          badgeTone="success"
          subtitle="38 comprobantes emitidos"
          icon="receipt"
        />
        <StatMetricCard
          title="Facturación Electrónica"
          value="Activa"
          badgeText="En Línea"
          badgeTone="brand"
          subtitle="Rango SETP 990000000 - 995000000"
          icon="shield"
        />
        <StatMetricCard
          title="Catálogo & Bodega"
          value="142 SKUs"
          badgeText="98.6% Stock OK"
          badgeTone="success"
          subtitle="Bodega Principal Mostrador #01"
          icon="package"
        />
        <StatMetricCard
          title="Rol de Usuario"
          value={session.primaryRoleLabel}
          badgeText="Sesión Activa"
          badgeTone="brand"
          subtitle={session.email}
          icon="user"
        />
      </section>

      {/* Grid Principal: Liquidador Tributario + Catálogo Rápido */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1.05fr) minmax(360px, 1.25fr)',
          gap: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="calculator" size={20} style={{ color: 'var(--brand-primary)' }} />
              <Typography as="h2" variant="h2">
                Liquidación Tributaria
              </Typography>
            </div>
            <Badge tone="brand">DIAN</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              id="nit-input"
              label="NIT o Documento Adquirente"
              value={rawNit}
              onChange={(e) => setRawNit(e.target.value)}
              placeholder="Ej: 901458210 o 222222222222"
            />
            <FormField
              id="amount-input"
              type="number"
              label="Subtotal Base (COP)"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              placeholder="Ej: 285000"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tipo de Adquirente
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
                  { id: 'PERSONA_JURIDICA', label: 'Empresa (NIT)' },
                  { id: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
                ] as const
              ).map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={regime === item.id ? 'primary' : 'outline'}
                  onClick={() => {
                    setRegime(item.id);
                    if (item.id === 'CONSUMIDOR_FINAL') {
                      setRawNit('222222222222');
                    } else if (rawNit === '222222222222') {
                      setRawNit('901458210');
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tributo Aplicable
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'IVA_19', label: 'IVA General 19%' },
                  { id: 'INC_8', label: 'INC Consumo 8%' },
                  { id: 'IVA_5', label: 'IVA Reducido 5%' },
                  { id: 'EXENTO_0', label: 'Exento 0%' },
                ] as const
              ).map((tax) => (
                <Button
                  key={tax.id}
                  type="button"
                  size="sm"
                  variant={taxType === tax.id ? 'subtle' : 'outline'}
                  onClick={() => setTaxType(tax.id)}
                >
                  {tax.label}
                </Button>
              ))}
            </div>
          </div>

          <Divider margin="6px 0" />

          {simulationResult.isFailure ? (
            <AlertBanner tone="danger" message={simulationResult.error!} />
          ) : (
            (() => {
              const settlement = simulationResult.getValue().props;
              return (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-muted)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>NIT Formateado + DV:</span>
                    <strong style={{ color: 'var(--brand-primary)' }}>
                      {settlement.customerNit.formatted}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal Gravable:</span>
                    <strong>{settlement.subtotal.format()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Impuesto ({settlement.taxRatePercent}%):
                    </span>
                    <strong style={{ color: '#047857' }}>+ {settlement.taxAmount.format()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>ReteFuente (2.5%):</span>
                    <strong style={{ color: '#b45309' }}>
                      - {settlement.withholdingAmount.format()}
                    </strong>
                  </div>
                  <Divider margin="4px 0" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '1.05rem',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Total Neto a Cobrar:</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      {settlement.totalPayable.format()}
                    </span>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="store" size={20} style={{ color: 'var(--brand-primary)' }} />
              <Typography as="h2" variant="h2">
                Catálogo NatsarStore
              </Typography>
            </div>
            <Badge tone="success" dot>
              Disponible
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SAMPLE_POS_PRODUCTS.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setBaseAmount(String(product.priceCop));
                  setTaxType(product.taxType);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor:
                    Number(baseAmount) === product.priceCop && taxType === product.taxType
                      ? 'var(--brand-primary-soft)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {product.name}
                    </span>
                    <Badge tone="neutral">{product.taxLabel}</Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    SKU: {product.sku} • {product.category} • Stock: {product.stock} unds
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '0.96rem',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    $ {product.priceCop.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </WorkspaceShellTemplate>
  );
};
