import React from 'react';

export interface TypographyProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  tone?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Átomo Typography: Escala tipográfica corporativa unificada.
 */
export const Typography: React.FC<TypographyProps> = ({
  as: Component = 'p',
  variant = 'body',
  tone = 'primary',
  align = 'left',
  children,
  style,
}) => {
  const variantMap: Record<NonNullable<TypographyProps['variant']>, React.CSSProperties> = {
    display: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.65rem, 2.3vw, 2.15rem)',
      fontWeight: 800,
      lineHeight: 1.18,
      letterSpacing: '-0.025em',
    },
    h1: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.65rem',
      fontWeight: 700,
      lineHeight: 1.22,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.02rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    body: {
      fontSize: '0.9rem',
      fontWeight: 400,
      lineHeight: 1.55,
    },
    caption: {
      fontSize: '0.78rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
  };

  const toneMap: Record<NonNullable<TypographyProps['tone']>, string> = {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    inverse: 'var(--text-inverse)',
    brand: 'var(--brand-primary)',
  };

  return (
    <Component
      style={{
        color: toneMap[tone],
        textAlign: align,
        ...variantMap[variant],
        ...style,
      }}
    >
      {children}
    </Component>
  );
};
