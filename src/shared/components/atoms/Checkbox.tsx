import React from 'react';
import { Icon } from './Icon';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

/**
 * Átomo Checkbox: Casilla de verificación corporativa minimalista (ej. "Recuérdame").
 */
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, id }) => {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.84rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? 'var(--brand-primary)' : '#FFFFFF',
          border: `1.5px solid ${checked ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          color: '#FFFFFF',
          transition: 'all var(--transition-fast)',
          flexShrink: 0,
        }}
      >
        {checked && <Icon name="check" size={12} />}
      </span>
      {label && <span>{label}</span>}
    </label>
  );
};
