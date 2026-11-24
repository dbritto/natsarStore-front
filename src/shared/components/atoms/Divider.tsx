import React from 'react';

export interface DividerProps {
  label?: string;
  margin?: string;
}

/**
 * Átomo Divider: Línea divisoria sutil con etiqueta central opcional ("o Ingresa con:" / "or Login with").
 */
export const Divider: React.FC<DividerProps> = ({ label, margin = '20px 0' }) => {
  if (!label) {
    return (
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--border-subtle)',
          margin,
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        margin,
      }}
    >
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
      <span
        style={{
          fontSize: '0.79rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
    </div>
  );
};
