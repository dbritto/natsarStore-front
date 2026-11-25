import React from 'react';

export interface ColorDotProps {
  colorHex?: string | null;
  size?: number;
}

/**
 * Átomo ColorDot: Indicador circular de color corporativo para categorías POS.
 */
export const ColorDot: React.FC<ColorDotProps> = ({ colorHex, size = 14 }) => {
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: colorHex || '#4D53F4',
        boxShadow: 'inset 0 0 0 1.5px rgba(15, 23, 42, 0.12)',
        flexShrink: 0,
      }}
    />
  );
};
