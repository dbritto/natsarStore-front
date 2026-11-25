import React, { useState } from 'react';
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
  | 'settings'
  | 'profile';

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
  onLogout?: () => void;
  onHideSidebar?: () => void;
  isDrawer?: boolean;
}

/**
 * Organismo SidebarNav:
 * Barra lateral vertical minimalista inspirada en el diseño DealDeck,
 * con grupos desplegables/ocultables (MENÚ, OPERACIÓN & STOCK, HERRAMIENTAS)
 * y botón para ocultar el panel lateral completo.
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection,
  onSelectSection,
  alertCount = 0,
  onHideSidebar,
  isDrawer = false,
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
        { id: 'profile', label: 'Mi Perfil & Datos', icon: 'user' },
        { id: 'rbac', label: 'Usuarios & Roles', icon: 'shield' },
        { id: 'settings', label: 'Configuración', icon: 'settings' },
      ],
    },
  ];

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'MENÚ': true,
    'OPERACIÓN & STOCK': true,
    'HERRAMIENTAS': true,
  });

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <aside
      style={{
        width: isDrawer ? '100%' : '254px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: isDrawer ? '0 26px 26px 0' : '26px',
        padding: '24px 18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxShadow: '0 10px 30px -15px rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(226, 232, 240, 0.7)',
        minHeight: isDrawer ? '100%' : 'calc(100vh - 44px)',
        height: isDrawer ? '100%' : undefined,
        overflowY: isDrawer ? 'auto' : undefined,
        position: isDrawer ? 'relative' : 'sticky',
        top: isDrawer ? 0 : '22px',
        transition: 'all 0.22s ease',
      }}
    >
      <div>
        {/* Cabecera Superior: Logo + Botón para Ocultar Slider Lateral */}
        <div
          style={{
            padding: '0 6px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <BrandLogo size="md" />

          {onHideSidebar && (
            <button
              type="button"
              onClick={onHideSidebar}
              title="Ocultar menú lateral"
              aria-label="Ocultar menú lateral"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.16s ease',
              }}
            >
              <Icon name="chevron-left" size={17} />
            </button>
          )}
        </div>

        {/* Grupos de Navegación Desplegables / Ocultables */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.groupTitle] ?? true;
            const hasActiveChild = group.items.some((it) => it.id === activeSection);

            return (
              <div
                key={group.groupTitle}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupTitle)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '7px 12px',
                    borderRadius: '11px',
                    border: 'none',
                    backgroundColor: !isExpanded && hasActiveChild ? '#EEF2FF' : 'transparent',
                    color: !isExpanded && hasActiveChild ? '#4D53F4' : '#64748B',
                    cursor: 'pointer',
                    transition: 'background-color 0.16s ease, color 0.16s ease',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.69rem',
                      fontWeight: 800,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.groupTitle}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {!isExpanded && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '999px',
                          backgroundColor: hasActiveChild ? '#4D53F4' : '#F1F5F9',
                          color: hasActiveChild ? '#FFFFFF' : '#64748B',
                        }}
                      >
                        {group.items.length}
                      </span>
                    )}
                    <Icon
                      name="chevron-down"
                      size={14}
                      style={{
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.18s ease',
                      }}
                    />
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
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
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
