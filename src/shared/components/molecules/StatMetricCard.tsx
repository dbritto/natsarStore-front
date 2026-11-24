import React from 'react';
import { Badge, BadgeTone } from '../atoms/Badge';
import { Icon, IconName } from '../atoms/Icon';

export interface StatMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badgeText?: string;
  badgeTone?: BadgeTone;
  icon: IconName;
}

/**
 * Molécula StatMetricCard: Tarjeta minimalista de indicador corporativo POS / DIAN.
 */
export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeTone = 'brand',
  icon,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--brand-primary-soft)',
            color: 'var(--brand-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.55rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          {value}
        </span>
        {badgeText && <Badge tone={badgeTone}>{badgeText}</Badge>}
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
