import React from 'react';

export interface TrendPillProps {
  value: string;
  direction?: 'up' | 'down' | 'neutral';
}

/**
 * Átomo TrendPill: Píldora de variación porcentual de alto contraste
 * (Verde menta brillante para incrementos, Rojo coral para alertas/caídas),
 * fiel al diseño de tarjetas de métricas DealDeck.
 */
export const TrendPill: React.FC<TrendPillProps> = ({ value, direction = 'up' }) => {
  const palette = {
    up: {
      bg: '#6EE7B7',
      color: '#064E3B',
    },
    down: {
      bg: '#F87171',
      color: '#FFFFFF',
    },
    neutral: {
      bg: '#E2E8F0',
      color: '#334155',
    },
  }[direction];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 10px',
        borderRadius: '999px',
        backgroundColor: palette.bg,
        color: palette.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.1,
      }}
    >
      {value}
    </span>
  );
};
