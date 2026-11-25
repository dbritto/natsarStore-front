import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { DialogModal } from '../molecules/DialogModal';
import { PosPaymentAmountRow } from '../molecules/PosPaymentAmountRow';

export type PosPaymentMethodId = 'CASH' | 'CARD' | 'TRANSFER_BRE_B';

export interface PosPaymentLineInput {
  method: PosPaymentMethodId;
  amountCop: number;
  tenderedCop?: number;
}

export interface PosPaymentModalProps {
  isOpen: boolean;
  totalCop: number;
  isProcessing?: boolean;
  onConfirm: (payments: PosPaymentLineInput[]) => void;
  onClose: () => void;
}

const METHODS: { id: PosPaymentMethodId; label: string; emoji: string }[] = [
  { id: 'CASH', label: 'Efectivo', emoji: '💵' },
  { id: 'CARD', label: 'Tarjeta', emoji: '💳' },
  { id: 'TRANSFER_BRE_B', label: 'Bre-B QR', emoji: '📲' },
];

const formatCop = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;

/**
 * Organismo PosPaymentModal
 * Punto de pago: un solo medio (con calculadora de vueltas) o pago dividido entre
 * efectivo, tarjeta y Bre-B QR. Solo gestiona estado de formulario; la validación de
 * negocio la hace el dominio (PosCartModel.validatePayments).
 */
export const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  isOpen,
  totalCop,
  isProcessing = false,
  onConfirm,
  onClose,
}) => {
  const [mode, setMode] = useState<'single' | 'split'>('single');
  const [singleMethod, setSingleMethod] = useState<PosPaymentMethodId>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [splitAmounts, setSplitAmounts] = useState<Record<PosPaymentMethodId, string>>({
    CASH: '',
    CARD: '',
    TRANSFER_BRE_B: '',
  });

  useEffect(() => {
    if (isOpen) {
      setMode('single');
      setSingleMethod('CASH');
      setCashReceived(String(Math.round(totalCop)));
      setSplitAmounts({ CASH: '', CARD: '', TRANSFER_BRE_B: '' });
    }
  }, [isOpen, totalCop]);

  const total = Math.round(totalCop);
  const assigned = useMemo(
    () => METHODS.reduce((acc, m) => acc + (Number(splitAmounts[m.id]) || 0), 0),
    [splitAmounts]
  );
  const remaining = total - assigned;
  const cashReceivedNum = Number(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNum - total);

  const canConfirm =
    mode === 'single'
      ? singleMethod !== 'CASH' || cashReceivedNum >= total
      : remaining === 0 && assigned > 0;

  const handleConfirm = () => {
    if (mode === 'single') {
      onConfirm([
        singleMethod === 'CASH'
          ? { method: 'CASH', amountCop: total, tenderedCop: cashReceivedNum }
          : { method: singleMethod, amountCop: total },
      ]);
      return;
    }
    onConfirm(
      METHODS.filter((m) => (Number(splitAmounts[m.id]) || 0) > 0).map((m) => ({
        method: m.id,
        amountCop: Number(splitAmounts[m.id]) || 0,
      }))
    );
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 12px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.8rem',
    backgroundColor: active ? '#FFFFFF' : 'transparent',
    color: active ? '#4D53F4' : '#64748B',
    boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
  });

  return (
    <DialogModal
      isOpen={isOpen}
      title="Cobrar venta"
      subtitle="Elige cómo paga el cliente: un solo medio o dividido"
      maxWidth="520px"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isProcessing}
            disabled={!canConfirm}
            leftIcon={<Icon name="receipt" size={16} />}
            onClick={handleConfirm}
          >
            Confirmar y facturar
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Total */}
        <div
          style={{
            textAlign: 'center',
            padding: '14px',
            borderRadius: '16px',
            backgroundColor: '#F5F7FF',
            border: '1px solid #E0E7FF',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total a pagar
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#4D53F4',
              lineHeight: 1.2,
            }}
          >
            {formatCop(total)}
          </div>
        </div>

        {/* Selector de modo */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', backgroundColor: '#F1F5F9' }}>
          <button type="button" style={tabStyle(mode === 'single')} onClick={() => setMode('single')}>
            Un solo medio
          </button>
          <button type="button" style={tabStyle(mode === 'split')} onClick={() => setMode('split')}>
            Pago dividido
          </button>
        </div>

        {mode === 'single' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {METHODS.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="md"
                  variant={singleMethod === m.id ? 'primary' : 'outline'}
                  onClick={() => setSingleMethod(m.id)}
                >
                  {m.emoji} {m.label}
                </Button>
              ))}
            </div>

            {singleMethod === 'CASH' && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                    Efectivo recibido
                    <input
                      type="number"
                      min={0}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        width: '150px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                      }}
                    />
                  </label>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      Vueltas
                    </span>
                    <strong
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.4rem',
                        color: cashReceivedNum >= total ? '#047857' : '#DC2626',
                      }}
                    >
                      {formatCop(change)}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: 'Exacto', val: total },
                    { label: '$50k', val: 50000 },
                    { label: '$100k', val: 100000 },
                    { label: '$200k', val: 200000 },
                  ].map((b) => (
                    <Button
                      key={b.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCashReceived(String(b.val))}
                      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
                    >
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {METHODS.map((m) => (
              <PosPaymentAmountRow
                key={m.id}
                label={m.label}
                emoji={m.emoji}
                value={splitAmounts[m.id]}
                onChange={(val) => setSplitAmounts((prev) => ({ ...prev, [m.id]: val }))}
                canFillRemaining={remaining > 0}
                onFillRemaining={() =>
                  setSplitAmounts((prev) => ({
                    ...prev,
                    [m.id]: String((Number(prev[m.id]) || 0) + Math.max(0, remaining)),
                  }))
                }
              />
            ))}

            {/* Progreso */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: remaining === 0 ? '#ECFDF5' : remaining < 0 ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${remaining === 0 ? '#A7F3D0' : remaining < 0 ? '#FECACA' : '#FDE68A'}`,
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                Asignado <strong style={{ color: '#0F172A' }}>{formatCop(assigned)}</strong>
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: remaining === 0 ? '#047857' : remaining < 0 ? '#DC2626' : '#B45309',
                }}
              >
                {remaining === 0
                  ? '✔ Pago completo'
                  : remaining > 0
                    ? `Faltan ${formatCop(remaining)}`
                    : `Sobran ${formatCop(Math.abs(remaining))}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogModal>
  );
};
