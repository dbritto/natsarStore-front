import React, { useState } from 'react';
import { PeriodOption, PeriodSelectPill } from '../atoms/PeriodSelectPill';

export interface BarChartDataPoint {
  label: string;
  primaryValue: number;
  secondaryValue: number;
  primaryFormatted: string;
  secondaryFormatted: string;
}

export interface RoundedBarChartCardProps {
  title: string;
  subtitle: string;
  primaryLegend: string;
  secondaryLegend: string;
  period: string;
  periodOptions: PeriodOption[];
  onPeriodChange: (period: string) => void;
  data: BarChartDataPoint[];
}

/**
 * Organismo RoundedBarChartCard:
 * Gráfico de barras dobles redondeadas tipo píldora con tooltip flotante oscuro (#131622),
 * fiel a la tarjeta "Customer Habbits" de la imagen de referencia.
 */
export const RoundedBarChartCard: React.FC<RoundedBarChartCardProps> = ({
  title,
  subtitle,
  primaryLegend,
  secondaryLegend,
  period,
  periodOptions,
  onPeriodChange,
  data,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(Math.min(3, Math.max(0, data.length - 1)));

  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.primaryValue, d.secondaryValue])
  );

  const yTicks = ['100%', '75%', '50%', '25%', '0%'];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px 26px',
        boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(226, 232, 240, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '18px',
      }}
    >
      {/* Cabecera de la tarjeta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.14rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '0.77rem', color: '#94A3B8', marginTop: '3px' }}>
            {subtitle}
          </p>
        </div>

        <PeriodSelectPill
          value={period}
          options={periodOptions}
          onChange={onPeriodChange}
        />
      </div>

      {/* Leyenda y Tooltip Flotante Oscuro */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.76rem', color: '#64748B', fontWeight: 500 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#DCE2F0' }} />
            {secondaryLegend}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.76rem', color: '#64748B', fontWeight: 500 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#4D53F4' }} />
            {primaryLegend}
          </span>
        </div>

        {data[activeIndex] && (
          <div
            style={{
              backgroundColor: '#131622',
              color: '#FFFFFF',
              borderRadius: '14px',
              padding: '9px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.73rem',
              boxShadow: '0 10px 22px -6px rgba(19, 22, 34, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#DCE2F0' }} />
              <span style={{ fontWeight: 700 }}>{data[activeIndex].secondaryFormatted}</span>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>{data[activeIndex].label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4D53F4' }} />
              <span style={{ fontWeight: 700 }}>{data[activeIndex].primaryFormatted}</span>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>{primaryLegend}</span>
            </div>
          </div>
        )}
      </div>

      {/* Área de Barras Píldora */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '38px 1fr',
          gap: '12px',
          alignItems: 'end',
          paddingTop: '8px',
        }}
      >
        {/* Eje Y */}
        <div
          style={{
            height: '168px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#94A3B8',
            fontWeight: 500,
            paddingBottom: '22px',
          }}
        >
          {yTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {/* Columnas de barras */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, data.length)}, 1fr)`,
            gap: '10px',
            alignItems: 'end',
            height: '168px',
          }}
        >
          {data.map((point, idx) => {
            const hSecondary = Math.max(18, Math.round((point.secondaryValue / maxVal) * 132));
            const hPrimary = Math.max(18, Math.round((point.primaryValue / maxVal) * 132));
            const isSelected = idx === activeIndex;

            return (
              <div
                key={point.label}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '6px',
                    height: '136px',
                  }}
                >
                  {/* Barra Gris Suave */}
                  <div
                    style={{
                      width: '16px',
                      height: `${hSecondary}px`,
                      borderRadius: '999px',
                      backgroundColor: isSelected ? '#CBD5E1' : '#E2E8F0',
                      transition: 'height 260ms ease, background-color 180ms ease',
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#131622',
                          border: '1.5px solid #FFFFFF',
                        }}
                      />
                    )}
                  </div>

                  {/* Barra Azul Eléctrico */}
                  <div
                    style={{
                      width: '16px',
                      height: `${hPrimary}px`,
                      borderRadius: '999px',
                      backgroundColor: '#4D53F4',
                      boxShadow: isSelected ? '0 6px 14px rgba(77, 83, 244, 0.38)' : 'none',
                      transition: 'height 260ms ease',
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0F172A' : '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '72px',
                  }}
                >
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
