import React from 'react';
import { Icon, IconName } from '../atoms/Icon';

export interface SidebarNavItemProps {
  icon: IconName;
  label: string;
  active?: boolean;
  badgeCount?: number;
  onClick: () => void;
}

/**
 * Molécula SidebarNavItem: Ítem de navegación lateral con estado activo en píldora azul (#4D53F4).
 */
export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon,
  label,
  active = false,
  badgeCount,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '11px 16px',
        borderRadius: '14px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? '#4D53F4' : 'transparent',
        color: active ? '#FFFFFF' : '#64748B',
        fontWeight: active ? 600 : 500,
        fontSize: '0.86rem',
        boxShadow: active ? '0 10px 20px -6px rgba(77, 83, 244, 0.45)' : 'none',
        transition: 'all var(--transition-fast)',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
        <Icon name={icon} size={18} />
        <span>{label}</span>
      </span>

      {badgeCount !== undefined && badgeCount > 0 && (
        <span
          style={{
            padding: '2px 7px',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 700,
            backgroundColor: active ? 'rgba(255, 255, 255, 0.22)' : '#FEE2E2',
            color: active ? '#FFFFFF' : '#DC2626',
          }}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
};
