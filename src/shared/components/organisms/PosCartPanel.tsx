import React from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Divider } from '../atoms/Divider';
import { FormField } from '../molecules/FormField';
import { Icon } from '../atoms/Icon';
import { PosCartItemRow } from '../molecules/PosCartItemRow';

export interface PosCartLineDisplay {
  catalogItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
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
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER_BRE_B';
  onSelectPaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER_BRE_B') => void;
  cashTenderedText: string;
  onChangeCashTendered: (val: string) => void;
  changeDueCop: number;
  isShiftOpen: boolean;
  onOpenShiftModal: () => void;
  onCheckout: () => void;
}

/**
 * Organismo PosCartPanel (Componente Bruto / Presentacional Puro)
 * Columna izquierda de la caja registradora ("Venta Actual / Ticket").
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
  paymentMethod,
  onSelectPaymentMethod,
  cashTenderedText,
  onChangeCashTendered,
  changeDueCop,
  isShiftOpen,
  onOpenShiftModal,
  onCheckout,
}) => {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0];
  const totalItemsCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const netPayableCop = liquidation?.netPayable ?? 0;
  const cashTenderedCop = Number(cashTenderedText) || 0;

  const formatCop = (val: number) => `$ ${val.toLocaleString('es-CO')}`;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '22px',
        boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.07)',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'sticky',
        top: '20px',
      }}
    >
      {/* Cabecera del Ticket */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Venta Actual
          </h2>
          <Badge tone="brand">{totalItemsCount} artículos</Badge>
        </div>

        <Button
          type="button"
          variant={isShiftOpen ? 'outline' : 'primary'}
          size="sm"
          leftIcon={<Icon name="lock" size={13} />}
          onClick={onOpenShiftModal}
          style={{ fontSize: '0.74rem', padding: '4px 10px' }}
        >
          {isShiftOpen ? 'Arqueo Turno' : 'Abrir Turno'}
        </Button>
      </div>

      {/* Selector Rápido de Cliente DIAN */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Adquirente / Factura DIAN
          </span>
          <span style={{ fontSize: '0.68rem', color: '#4D53F4', fontWeight: 700 }}>
            {selectedCustomer?.identificationFormatted}
          </span>
        </div>
        <select
          value={selectedCustomer?.id ?? ''}
          onChange={(e) => onSelectCustomerId(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            fontSize: '0.82rem',
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
      </div>

      {/* Renglones de la Venta */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {lines.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              borderRadius: '16px',
              backgroundColor: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              color: '#94A3B8',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Icon name="package" size={26} style={{ color: '#CBD5E1' }} />
            <span>La canasta está vacía. Selecciona productos del menú para comenzar.</span>
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
              isDrink={line.isDrink}
              onIncrement={() => onIncrementLine(line.catalogItemId)}
              onDecrement={() => onDecrementLine(line.catalogItemId)}
              onRemove={() => onRemoveLine(line.catalogItemId)}
            />
          ))
        )}
      </div>

      {/* Desglose Financiero */}
      {liquidation && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '16px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
            <span>Subtotal Base:</span>
            <strong>{formatCop(liquidation.taxableBase)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
            <span>Impuestos (IVA / INC):</span>
            <strong>+ {formatCop(liquidation.totalTaxes)}</strong>
          </div>
          {liquidation.totalWithholdings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
              <span>Retenciones:</span>
              <strong>- {formatCop(liquidation.totalWithholdings)}</strong>
            </div>
          )}
          <Divider margin="4px 0" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
              Total a Pagar:
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#4D53F4',
              }}
            >
              {formatCop(netPayableCop)}
            </span>
          </div>
        </div>
      )}

      {/* Medios de Pago */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
          Medio de Pago
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {(
            [
              { id: 'CASH', label: '💵 Efectivo' },
              { id: 'CARD', label: '💳 Tarjeta' },
              { id: 'TRANSFER_BRE_B', label: '📲 Bre-B QR' },
            ] as const
          ).map((pm) => (
            <Button
              key={pm.id}
              type="button"
              size="sm"
              variant={paymentMethod === pm.id ? 'primary' : 'outline'}
              onClick={() => onSelectPaymentMethod(pm.id)}
              style={{ fontSize: '0.76rem', height: '32px' }}
            >
              {pm.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Calculadora de Vueltas en Efectivo */}
      {paymentMethod === 'CASH' && lines.length > 0 && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '14px',
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
            <FormField
              type="number"
              label="Efectivo Recibido"
              value={cashTenderedText}
              onChange={(e) => onChangeCashTendered(e.target.value)}
            />
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                Vueltas / Cambio
              </span>
              <strong
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  color: cashTenderedCop >= netPayableCop ? '#047857' : '#DC2626',
                }}
              >
                {formatCop(changeDueCop)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { label: 'Exacto', val: netPayableCop },
              { label: '$50k', val: 50000 },
              { label: '$100k', val: 100000 },
              { label: '$200k', val: 200000 },
            ].map((bill) => (
              <Button
                key={bill.label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChangeCashTendered(String(bill.val))}
                style={{ flex: 1, height: '28px', fontSize: '0.7rem', padding: '0 4px', backgroundColor: '#FFFFFF' }}
              >
                {bill.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {lines.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClearCart}
            style={{
              color: '#64748B',
              borderColor: '#CBD5E1',
              minWidth: '110px',
            }}
          >
            Vaciar
          </Button>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={lines.length === 0}
          leftIcon={<Icon name="receipt" size={18} />}
          onClick={onCheckout}
          style={{
            boxShadow: '0 8px 20px rgba(77, 83, 244, 0.35)',
            fontSize: '0.94rem',
            fontWeight: 700,
          }}
        >
          {lines.length > 0 ? `Cobrar ${formatCop(netPayableCop)}` : 'Cobrar Venta'}
        </Button>
      </div>
    </div>
  );
};
