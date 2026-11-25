import React from 'react';
import { Icon, IconName } from '../atoms/Icon';

export interface PosMiniKpiCardProps {
  title: string;
  value: string;
  subtext?: string;
  badgeLabel?: string;
  badgeTone?: 'success' | 'danger' | 'brand' | 'warning' | 'neutral';
  icon: IconName;
  iconBgColor?: string;
  iconColor?: string;
}

/**
 * Molécula PosMiniKpiCard (Componente Bruto / Presentacional Puro)
 * Tarjeta de métrica ultra-compacta diseñada para barras superiores de TPV.
 */
export const PosMiniKpiCard: React.FC<PosMiniKpiCardProps> = ({
  title,
  value,
  subtext,
  badgeLabel,
  badgeTone = 'brand',
  icon,
  iconBgColor = '#EEF2FF',
  iconColor = '#4D53F4',
}) => {
  const badgeStyles: Record<string, { bg: string; text: string }> = {
    success: { bg: '#ECFDF5', text: '#059669' },
    danger: { bg: '#FEF2F2', text: '#DC2626' },
    brand: { bg: '#EEF2FF', text: '#4D53F4' },
    warning: { bg: '#FFFBEB', text: '#D97706' },
    neutral: { bg: '#F1F5F9', text: '#64748B' },
  };

  const currentBadgeStyle = badgeStyles[badgeTone] ?? badgeStyles.brand;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '10px 14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: iconBgColor,
          color: iconColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#64748B',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>
          {badgeLabel && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: currentBadgeStyle.bg,
                color: currentBadgeStyle.text,
              }}
            >
              {badgeLabel}
            </span>
          )}
          {!badgeLabel && subtext && (
            <span style={{ fontSize: '0.62rem', color: '#64748B' }}>{subtext}</span>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#0F172A',
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};
