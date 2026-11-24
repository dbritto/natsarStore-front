import React from 'react';
import { Icon, IconName } from '../atoms/Icon';

export interface HeaderIconButtonProps {
  icon: IconName;
  ariaLabel: string;
  hasNotificationDot?: boolean;
  onClick?: () => void;
}

/**
 * Molécula HeaderIconButton: Botón circular blanco de 42x42px para la cabecera del dashboard
 * (Búsqueda y Notificaciones con punto indicador naranja/rojo).
 */
export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon,
  ariaLabel,
  hasNotificationDot = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        position: 'relative',
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        color: '#1E293B',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast)',
      }}
    >
      <Icon name={icon} size={18} />
      {hasNotificationDot && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '11px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#F97316',
            border: '1.5px solid #FFFFFF',
          }}
        />
      )}
    </button>
  );
};
