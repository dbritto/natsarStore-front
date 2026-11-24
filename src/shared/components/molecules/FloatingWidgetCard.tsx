import React from 'react';

export interface FloatingWidgetCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Molécula FloatingWidgetCard: Tarjeta blanca flotante sobre el panel visual corporativo
 * (inspirada en los widgets flotantes de divisa e ícono de la Imagen 1 - PRIX).
 */
export const FloatingWidgetCard: React.FC<FloatingWidgetCardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-floating)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        color: 'var(--text-primary)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
