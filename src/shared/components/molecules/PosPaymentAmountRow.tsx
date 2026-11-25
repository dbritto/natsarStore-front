import React from 'react';

export interface PosPaymentAmountRowProps {
  label: string;
  emoji: string;
  value: string;
  onChange: (value: string) => void;
  onFillRemaining: () => void;
  canFillRemaining: boolean;
}

/**
 * Molécula PosPaymentAmountRow (Componente Bruto / Presentacional Puro)
 * Fila de un medio de pago dentro del pago dividido: monto editable + atajo "Completar".
 */
export const PosPaymentAmountRow: React.FC<PosPaymentAmountRowProps> = ({
  label,
  emoji,
  value,
  onChange,
  onFillRemaining,
  canFillRemaining,
}) => {
  const hasAmount = (Number(value) || 0) > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '14px',
        border: hasAmount ? '1.5px solid #C7D2FE' : '1px solid #E2E8F0',
        backgroundColor: hasAmount ? '#F5F7FF' : '#FFFFFF',
        transition: 'all 0.16s ease',
      }}
    >
      <span style={{ fontSize: '1.2rem', width: '26px', textAlign: 'center' }}>{emoji}</span>
      <span style={{ flex: 1, fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{label}</span>

      <button
        type="button"
        onClick={onFillRemaining}
        disabled={!canFillRemaining}
        style={{
          border: 'none',
          background: 'transparent',
          color: canFillRemaining ? '#4D53F4' : '#CBD5E1',
          fontSize: '0.72rem',
          fontWeight: 700,
          cursor: canFillRemaining ? 'pointer' : 'default',
          textDecoration: canFillRemaining ? 'underline' : 'none',
        }}
      >
        Completar
      </button>

      <div style={{ position: 'relative', width: '130px' }}>
        <span
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          $
        </span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          placeholder="0"
          aria-label={`Monto en ${label}`}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px 8px 24px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#0F172A',
            textAlign: 'right',
            outline: 'none',
            backgroundColor: '#FFFFFF',
          }}
        />
      </div>
    </div>
  );
};
