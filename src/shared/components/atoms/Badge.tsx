import React from 'react';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Átomo Badge: Etiqueta minimalista para estados DIAN, roles RBAC y métricas POS.
 */
export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot = false, children, style }) => {
  const toneStyles: Record<BadgeTone, { bg: string; color: string; dotColor: string }> = {
    brand: {
      bg: 'var(--brand-primary-soft)',
      color: 'var(--brand-primary)',
      dotColor: 'var(--brand-primary)',
    },
    success: {
      bg: 'var(--status-success-bg)',
      color: '#047857',
      dotColor: 'var(--status-success)',
    },
    warning: {
      bg: 'var(--status-warning-bg)',
      color: '#b45309',
      dotColor: 'var(--status-warning)',
    },
    danger: {
      bg: 'var(--status-danger-bg)',
      color: '#b91c1c',
      dotColor: 'var(--status-danger)',
    },
    neutral: {
      bg: '#f1f5f9',
      color: '#475569',
      dotColor: '#64748b',
    },
  };

  const current = toneStyles[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: current.bg,
        color: current.color,
        fontSize: '0.74rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: current.dotColor,
          }}
        />
      )}
      {children}
    </span>
  );
};
