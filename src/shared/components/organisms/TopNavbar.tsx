import React from 'react';
import { BrandLogo } from '../atoms/BrandLogo';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export interface TopNavbarProps {
  userFullName: string;
  userEmail: string;
  primaryRole: string;
  isSuperAdmin: boolean;
  onLogout: () => void;
}

/**
 * Organismo TopNavbar: Barra superior corporativa minimalista para NatsarStore.
 */
export const TopNavbar: React.FC<TopNavbarProps> = ({
  userFullName,
  userEmail,
  primaryRole,
  isSuperAdmin,
  onLogout,
}) => {
  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <BrandLogo size="md" subtitle="Gestión Comercial & POS" />
        <Badge tone="success" dot>
          Sede Principal • En Línea
        </Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            {userFullName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {userFullName}
              </span>
              <Badge tone="brand">
                {isSuperAdmin ? 'SUPER_ADMIN' : primaryRole}
              </Badge>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{userEmail}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          leftIcon={<Icon name="logout" size={15} />}
        >
          Salir
        </Button>
      </div>
    </header>
  );
};
