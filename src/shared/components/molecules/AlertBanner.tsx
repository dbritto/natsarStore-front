import React from 'react';
import { Icon } from '../atoms/Icon';

export interface AlertBannerProps {
  tone?: 'danger' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

/**
 * Molécula AlertBanner: Alerta corporativa limpia para errores de autenticación o avisos de negocio.
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  tone = 'danger',
  message,
  onClose,
}) => {
  const palette = {
    danger: {
      bg: 'var(--status-danger-bg)',
      border: '#fecaca',
      color: '#b91c1c',
    },
    success: {
      bg: 'var(--status-success-bg)',
      border: '#a7f3d0',
      color: '#047857',
    },
    info: {
      bg: 'var(--brand-primary-soft)',
      border: 'rgba(79, 85, 241, 0.22)',
      color: 'var(--brand-primary)',
    },
  }[tone];

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '11px 14px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: '0.82rem',
        fontWeight: 500,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <Icon name={tone === 'success' ? 'check' : 'alert'} size={16} />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
