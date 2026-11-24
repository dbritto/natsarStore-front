import React from 'react';
import { PeriodOption, PeriodSelectPill } from '../atoms/PeriodSelectPill';

export interface BubbleSegmentItem {
  label: string;
  count: string;
  progressPct: number;
  badgeIcon: string;
}

export interface BubbleGrowthCardProps {
  title: string;
  subtitle: string;
  period: string;
  periodOptions: PeriodOption[];
  onPeriodChange: (period: string) => void;
  items: BubbleSegmentItem[];
}

/**
 * Organismo BubbleGrowthCard:
 * Tarjeta con burbujas superpuestas en tonos azul/índigo a la izquierda
 * y barras de progreso horizontales a la derecha, fiel a "Customer Growth" de la referencia.
 */
export const BubbleGrowthCard: React.FC<BubbleGrowthCardProps> = ({
  title,
  subtitle,
  period,
  periodOptions,
  onPeriodChange,
  items,
}) => {
  const b0 = items[0]?.count ?? '2.417';
  const b1 = items[1]?.count ?? '2.281';
  const b2 = items[2]?.count ?? '812';
  const b3 = items[3]?.count ?? '287';

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
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

      {/* Cuerpo: Cluster de Burbujas a la izquierda + Barras horizontales a la derecha */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '132px 1fr',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        {/* Burbujas Superpuestas */}
        <div style={{ position: 'relative', width: '130px', height: '136px' }}>
          {/* Burbuja Principal Azul Eléctrico */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              right: '6px',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#4D53F4',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.84rem',
              boxShadow: '0 8px 18px rgba(77, 83, 244, 0.35)',
            }}
          >
            {b0}
          </div>

          {/* Burbuja Inferior Izquierda Indigo Medio */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              width: '66px',
              height: '66px',
              borderRadius: '50%',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.8rem',
              border: '2px solid rgba(255, 255, 255, 0.65)',
            }}
          >
            {b1}
          </div>

          {/* Burbuja Superior Izquierda Periwinkle */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '14px',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#A5B4FC',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.73rem',
              border: '2px solid rgba(255, 255, 255, 0.75)',
            }}
          >
            {b3}
          </div>

          {/* Burbuja Inferior Derecha Lavanda */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#818CF8',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.74rem',
              border: '2px solid rgba(255, 255, 255, 0.75)',
            }}
          >
            {b2}
          </div>
        </div>

        {/* Lista de Barras de Progreso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#F4F6FB',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0,
                }}
              >
                {item.badgeIcon}
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>{item.count}</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: '#F1F5F9',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(12, item.progressPct))}%`,
                      height: '100%',
                      borderRadius: '999px',
                      backgroundColor: '#4D53F4',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
