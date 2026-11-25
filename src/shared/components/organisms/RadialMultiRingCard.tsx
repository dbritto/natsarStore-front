import React from 'react';
import { Icon, IconName } from '../atoms/Icon';
import { PeriodOption, PeriodSelectPill } from '../atoms/PeriodSelectPill';
import { TrendPill } from '../atoms/TrendPill';

export interface RadialBreakdownRow {
  label: string;
  value: string;
  trendValue: string;
  trendDirection: 'up' | 'down' | 'neutral';
  color: string;
  pct: number;
  icon: IconName;
}

export interface RadialMultiRingCardProps {
  title: string;
  subtitle: string;
  centerMetricValue: string;
  centerMetricLabel: string;
  centerTrendValue: string;
  period: string;
  periodOptions: PeriodOption[];
  onPeriodChange: (period: string) => void;
  rows: RadialBreakdownRow[];
}

/**
 * Organismo RadialMultiRingCard:
 * Tarjeta de anillos concéntricos SVG + desglose por categorías con píldoras de porcentaje,
 * fiel a la tarjeta "Product Statistic" de la imagen de referencia.
 */
export const RadialMultiRingCard: React.FC<RadialMultiRingCardProps> = ({
  title,
  subtitle,
  centerMetricValue,
  centerMetricLabel,
  centerTrendValue,
  period,
  periodOptions,
  onPeriodChange,
  rows,
}) => {
  const radii = [68, 53, 38];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(226, 232, 240, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '18px',
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ minWidth: 0, flex: '1 1 150px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.12rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '3px' }}>
            {subtitle}
          </p>
        </div>

        <PeriodSelectPill
          value={period}
          options={periodOptions}
          onChange={onPeriodChange}
        />
      </div>

      {/* Anillos Concéntricos SVG + Métrica Derecha */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '4px 0',
        }}
      >
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
          {radii.map((r, index) => {
            const row = rows[index];
            const circumference = 2 * Math.PI * r;
            const pct = Math.min(92, Math.max(15, row?.pct ?? 65 - index * 18));
            const dashOffset = circumference - (pct / 100) * circumference;
            const strokeColor = row?.color ?? (index === 0 ? '#4D53F4' : index === 1 ? '#3730A3' : '#EF4444');

            return (
              <g key={r} transform="rotate(-90 80 80)">
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="8.5"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.62rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {centerMetricValue}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
            {centerMetricLabel}
          </span>
          <TrendPill value={centerTrendValue} direction="up" />
        </div>
      </div>

      {/* Lista inferior de categorías / segmentos ABC */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px 10px',
              fontSize: '0.83rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B', fontWeight: 600 }}>
              <span style={{ color: '#64748B', display: 'inline-flex' }}>
                <Icon name={row.icon} size={16} />
              </span>
              <span>{row.label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{row.value}</span>
              <TrendPill value={row.trendValue} direction={row.trendDirection} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
