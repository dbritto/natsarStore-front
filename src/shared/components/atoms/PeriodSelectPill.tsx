import React from 'react';
import { Icon } from './Icon';

export interface PeriodOption {
  value: string;
  label: string;
}

export interface PeriodSelectPillProps {
  value: string;
  options: PeriodOption[];
  onChange: (value: string) => void;
}

/**
 * Átomo PeriodSelectPill: Selector compacto tipo píldora (ej. "Hoy", "Semanal", "Mensual")
 * para las tarjetas analíticas del dashboard.
 */
export const PeriodSelectPill: React.FC<PeriodSelectPillProps> = ({
  value,
  options,
  onChange,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          backgroundColor: '#F4F6FB',
          border: '1px solid transparent',
          borderRadius: '10px',
          padding: '6px 28px 6px 12px',
          fontSize: '0.76rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: 'absolute',
          right: '9px',
          pointerEvents: 'none',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
        }}
      >
        <Icon name="chevron-down" size={14} />
      </span>
    </div>
  );
};
