import React from 'react';
import { Icon } from '../atoms/Icon';

export interface SelectOptionItem {
  value: string;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOptionItem[];
  errorMessage?: string;
  helperText?: string;
}

/**
 * Molécula SelectField (src/shared/components/molecules):
 * Selector desplegable corporativo minimalista homologado con `FormField`.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  errorMessage,
  helperText,
  id,
  style,
  ...selectProps
}) => {
  const hasError = Boolean(errorMessage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.81rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.005em',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <select
          id={id}
          style={{
            width: '100%',
            height: '48px',
            appearance: 'none',
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${hasError ? 'var(--status-danger)' : 'var(--border-input)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0 38px 0 16px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            ...style,
          }}
          {...selectProps}
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
            right: '14px',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
          }}
        >
          <Icon name="chevron-down" size={16} />
        </span>
      </div>

      {errorMessage ? (
        <span style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--status-danger)' }}>
          {errorMessage}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>
      ) : null}
    </div>
  );
};
