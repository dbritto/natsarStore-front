import React from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { PosCartItemRow } from '../molecules/PosCartItemRow';

export interface PosCartLineDisplay {
  catalogItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
  isDrink?: boolean;
}

export interface PosCustomerOption {
  id: string;
  names: string;
  identificationFormatted: string;
}

export interface PosLiquidationSummary {
  taxableBase: number;
  totalTaxes: number;
  totalWithholdings: number;
  netPayable: number;
}

export interface PosCartPanelProps {
  lines: PosCartLineDisplay[];
  customers: PosCustomerOption[];
  selectedCustomerId: string;
  onSelectCustomerId: (id: string) => void;
  onIncrementLine: (itemId: string) => void;
  onDecrementLine: (itemId: string) => void;
  onRemoveLine: (itemId: string) => void;
  onClearCart: () => void;
  liquidation: PosLiquidationSummary | null;
  isShiftOpen: boolean;
  onOpenShiftModal: () => void;
  onPay: () => void;
}

/**
 * Organismo PosCartPanel (Componente Bruto / Presentacional Puro)
 * "Venta Actual": lista de artículos con imagen, totales y botones Vaciar / Pagar.
 * El cobro (medios de pago y pagos divididos) vive en el modal PosPaymentModal.
 */
export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  lines,
  customers,
  selectedCustomerId,
  onSelectCustomerId,
  onIncrementLine,
  onDecrementLine,
  onRemoveLine,
  onClearCart,
  liquidation,
  isShiftOpen,
  onOpenShiftModal,
  onPay,
}) => {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0];
  const totalItemsCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const netPayableCop = liquidation?.netPayable ?? 0;
  const formatCop = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;

  const summaryRow = (label: string, value: string, color = '#64748B') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color }}>
      <span>{label}</span>
      <strong style={{ fontWeight: 600 }}>{value}</strong>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '22px',
        padding: '20px',
        boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.08)',
        border: '1px solid #E8ECF4',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'sticky',
        top: '20px',
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Venta Actual
          </h2>
          <Badge tone="brand">{totalItemsCount}</Badge>
        </div>

        <Button
          type="button"
          variant={isShiftOpen ? 'outline' : 'primary'}
          size="sm"
          leftIcon={<Icon name="lock" size={13} />}
          onClick={onOpenShiftModal}
          style={{ fontSize: '0.74rem', padding: '4px 10px' }}
        >
          {isShiftOpen ? 'Arqueo' : 'Abrir Turno'}
        </Button>
      </div>

      {/* Adquirente */}
      <select
        aria-label="Adquirente de la factura"
        value={selectedCustomer?.id ?? ''}
        onChange={(e) => onSelectCustomerId(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#0F172A',
          outline: 'none',
        }}
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.names} ({c.identificationFormatted})
          </option>
        ))}
      </select>

      {/* Artículos */}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '320px', overflowY: 'auto' }}>
        {lines.length === 0 ? (
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Icon name="package" size={28} style={{ color: '#CBD5E1' }} />
            <span>La venta está vacía. Toca un producto para agregarlo.</span>
          </div>
        ) : (
          lines.map((line) => (
            <PosCartItemRow
              key={line.catalogItemId}
              id={line.catalogItemId}
              name={line.name}
              unitPrice={line.unitPrice}
              quantity={line.quantity}
              lineTotal={line.lineTotal}
              imageUrl={line.imageUrl}
              isDrink={line.isDrink}
              onIncrement={() => onIncrementLine(line.catalogItemId)}
              onDecrement={() => onDecrementLine(line.catalogItemId)}
              onRemove={() => onRemoveLine(line.catalogItemId)}
            />
          ))
        )}
      </div>

      {/* Totales */}
      {liquidation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
          {summaryRow('Subtotal', formatCop(liquidation.taxableBase))}
          {summaryRow('Impuestos (IVA / INC)', formatCop(liquidation.totalTaxes))}
          {liquidation.totalWithholdings > 0 &&
            summaryRow('Retenciones', `- ${formatCop(liquidation.totalWithholdings)}`, '#B45309')}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: '4px',
              paddingTop: '10px',
              borderTop: '1px dashed #E2E8F0',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Total</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#0F172A',
              }}
            >
              {formatCop(netPayableCop)}
            </span>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={lines.length === 0}
          onClick={onClearCart}
          style={{ color: '#64748B', borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', minWidth: '96px' }}
        >
          Vaciar
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          disabled={lines.length === 0}
          onClick={onPay}
          style={{ boxShadow: '0 8px 20px rgba(77, 83, 244, 0.32)', fontWeight: 700 }}
        >
          {lines.length > 0 ? `Pagar ${formatCop(netPayableCop)}` : 'Pagar'}
        </Button>
      </div>
    </div>
  );
};
