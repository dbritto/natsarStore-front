import React from 'react';
import { Icon, IconName } from '../atoms/Icon';
import { TrendPill } from '../atoms/TrendPill';

export interface StatMetricCardProps {
  title: string;
  value: string;
  comparisonLine1?: string;
  comparisonLine2?: string;
  trendValue?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  badgeText?: string;
  badgeTone?: string;
  subtitle?: string;
  icon: IconName;
  featured?: boolean;
}

/**
 * Molécula StatMetricCard:
 * Tarjeta KPI corporativa inspirada en la referencia visual del dashboard:
 * - `featured: true` -> Tarjeta destacada en azul eléctrico (#4D53F4), ícono en caja blanca y texto blanco.
 * - `featured: false` -> Tarjeta blanca limpia (#FFFFFF), ícono en caja gris suave y texto oscuro.
 */
export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  title,
  value,
  comparisonLine1 = 'vs periodo',
  comparisonLine2 = 'anterior',
  trendValue,
  trendDirection = 'up',
  badgeText,
  subtitle,
  icon,
  featured = false,
}) => {
  const displayTrend = trendValue || badgeText;
  return (
    <div
      style={{
        background: featured
          ? 'linear-gradient(135deg, #4D53F4 0%, #3E44E3 100%)'
          : '#FFFFFF',
        color: featured ? '#FFFFFF' : 'var(--text-primary)',
        borderRadius: '22px',
        padding: '22px 24px',
        boxShadow: featured
          ? '0 16px 32px -10px rgba(77, 83, 244, 0.42)'
          : '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
        border: featured ? 'none' : '1px solid rgba(226, 232, 240, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '18px',
        minHeight: '154px',
        transition: 'transform var(--transition-fast)',
      }}
    >
      {/* Fila superior: Caja de ícono a la izquierda + Píldora de porcentaje a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '13px',
            backgroundColor: featured ? '#FFFFFF' : '#F4F6FB',
            color: featured ? '#1E293B' : '#1E293B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: featured ? '0 4px 12px rgba(0, 0, 0, 0.12)' : 'none',
          }}
        >
          <Icon name={icon} size={20} />
        </div>

        {displayTrend && <TrendPill value={displayTrend} direction={trendDirection} />}
      </div>

      {/* Bloque inferior: Título + Valor grande con texto comparativo en 2 líneas al lado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span
          style={{
            fontSize: '0.83rem',
            fontWeight: 500,
            color: featured ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)',
          }}
        >
          {title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.72rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: featured ? '#FFFFFF' : 'var(--text-primary)',
            }}
          >
            {value}
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.72rem',
              lineHeight: 1.25,
              color: featured ? 'rgba(255, 255, 255, 0.78)' : 'var(--text-muted)',
            }}
          >
            {subtitle ? (
              <span>{subtitle}</span>
            ) : (
              <>
                <span>{comparisonLine1}</span>
                <span>{comparisonLine2}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
