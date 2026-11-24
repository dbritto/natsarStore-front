import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

/**
 * Átomo BrandLogo: Identidad visual corporativa minimalista de NatsarStore.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  subtitle,
}) => {
  const iconDimensions = size === 'sm' ? 28 : size === 'lg' ? 40 : 34;
  const fontSize = size === 'sm' ? '1.1rem' : size === 'lg' ? '1.5rem' : '1.3rem';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      <svg width={iconDimensions} height={iconDimensions} viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="11" fill="var(--brand-primary)" />
        <path
          d="M18 8.5C12.753 8.5 8.5 12.753 8.5 18C8.5 23.247 12.753 27.5 18 27.5C23.247 27.5 27.5 23.247 27.5 18C27.5 16.1 26.92 14.33 25.95 12.85L18.8 19.2C17.4 20.4 15.2 19.4 15.2 17.55V10.1C16.09 9.07 17.02 8.5 18 8.5Z"
          fill="#FFFFFF"
        />
        <circle cx="23.5" cy="12.5" r="2.6" fill="#A5B4FC" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize,
            letterSpacing: '-0.03em',
            color: 'var(--brand-primary)',
          }}
        >
          Natsar<span style={{ fontWeight: 600, opacity: 0.85 }}>Store</span>
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
