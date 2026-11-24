import React from 'react';
import { HeaderIconButton } from '../molecules/HeaderIconButton';

export interface DashboardHeaderProps {
  title: string;
  dateSubtitle: string;
  userFullName: string;
  userRoleLabel: string;
  alertCount?: number;
  onRefresh?: () => void;
  onSearchClick?: () => void;
}

/**
 * Organismo DashboardHeader:
 * Cabecera limpia estilo DealDeck con título grande, fecha a la izquierda,
 * botones circulares de acción y perfil de usuario a la derecha.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  dateSubtitle,
  userFullName,
  userRoleLabel,
  alertCount = 0,
  onRefresh,
  onSearchClick,
}) => {
  const initials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.68rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            lineHeight: 1.18,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 500,
            color: '#64748B',
            marginTop: '4px',
          }}
        >
          {dateSubtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <HeaderIconButton
          icon="search"
          ariaLabel="Buscar en NatsarStore"
          onClick={onSearchClick}
        />
        {onRefresh && (
          <HeaderIconButton
            icon="refresh"
            ariaLabel="Sincronizar con API"
            onClick={onRefresh}
          />
        )}
        <HeaderIconButton
          icon="bell"
          ariaLabel="Alertas de inventario"
          hasNotificationDot={alertCount > 0}
        />

        {/* Perfil de Usuario */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            paddingLeft: '6px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4D53F4 0%, #818CF8 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.86rem',
              boxShadow: '0 6px 14px rgba(77, 83, 244, 0.25)',
            }}
          >
            {initials || 'NS'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {userFullName}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#64748B',
                marginTop: '2px',
              }}
            >
              {userRoleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
