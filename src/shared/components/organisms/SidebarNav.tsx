import React from 'react';
import { BrandLogo } from '../atoms/BrandLogo';
import { Icon, IconName } from '../atoms/Icon';
import { SidebarNavItem } from '../molecules/SidebarNavItem';

export type WorkspaceSectionId =
  | 'dashboard'
  | 'pos-terminal'
  | 'catalog'
  | 'customers'
  | 'inventory'
  | 'logistics'
  | 'establishments'
  | 'rbac'
  | 'settings';

export interface SidebarNavGroup {
  groupTitle: string;
  items: {
    id: WorkspaceSectionId;
    label: string;
    icon: IconName;
    badgeCount?: number;
  }[];
}

export interface SidebarNavProps {
  activeSection: WorkspaceSectionId;
  onSelectSection: (section: WorkspaceSectionId) => void;
  alertCount?: number;
  onLogout: () => void;
}

/**
 * Organismo SidebarNav:
 * Barra lateral vertical minimalista inspirada en el diseño DealDeck,
 * organizada según los módulos del Swagger oficial de NatsarStore.
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection,
  onSelectSection,
  alertCount = 0,
  onLogout,
}) => {
  const navGroups: SidebarNavGroup[] = [
    {
      groupTitle: 'MENÚ',
      items: [
        { id: 'dashboard', label: 'Reporte & Analítica', icon: 'bar-chart', badgeCount: alertCount },
        { id: 'pos-terminal', label: 'Caja Registradora POS', icon: 'receipt' },
        { id: 'catalog', label: 'Productos & Catálogo', icon: 'package' },
        { id: 'customers', label: 'Clientes & DIAN', icon: 'users' },
      ],
    },
    {
      groupTitle: 'OPERACIÓN & STOCK',
      items: [
        { id: 'inventory', label: 'Stock & Kárdex', icon: 'layers' },
        { id: 'logistics', label: 'Traslados & Conteos', icon: 'truck' },
        { id: 'establishments', label: 'Sedes POS', icon: 'store' },
      ],
    },
    {
      groupTitle: 'HERRAMIENTAS',
      items: [
        { id: 'rbac', label: 'Usuarios & Roles', icon: 'shield' },
        { id: 'settings', label: 'Configuración', icon: 'settings' },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '248px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: '26px',
        padding: '26px 18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px -15px rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(226, 232, 240, 0.7)',
        minHeight: 'calc(100vh - 44px)',
        position: 'sticky',
        top: '22px',
      }}
    >
      <div>
        {/* Logo Superior */}
        <div style={{ padding: '0 8px 26px' }}>
          <BrandLogo size="md" />
        </div>

        {/* Grupos de Navegación */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {navGroups.map((group) => (
            <div key={group.groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#94A3B8',
                  padding: '0 14px 6px',
                  textTransform: 'uppercase',
                }}
              >
                {group.groupTitle}
              </span>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeSection === item.id}
                  badgeCount={item.badgeCount}
                  onClick={() => onSelectSection(item.id)}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Tarjeta oscura inferior (Inspirada en la tarjeta "Upgrade Pro" del diseño de referencia) */}
      <div
        style={{
          marginTop: '24px',
          backgroundColor: '#131622',
          backgroundImage:
            'radial-gradient(circle at 95% 10%, rgba(255, 255, 255, 0.14) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(77, 83, 244, 0.25) 0%, transparent 55%)',
          borderRadius: '20px',
          padding: '18px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            color: '#131622',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="receipt" size={17} />
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            Facturación DIAN
          </div>
          <p
            style={{
              fontSize: '0.73rem',
              color: 'rgba(255, 255, 255, 0.68)',
              lineHeight: 1.4,
              marginTop: '3px',
            }}
          >
            Conectado con API POS & Anexo 1.9 UBL 2.1
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            marginTop: '4px',
            width: '100%',
            height: '36px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#4D53F4',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 6px 14px rgba(77, 83, 244, 0.4)',
          }}
        >
          <Icon name="logout" size={14} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
