import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Divider } from '../atoms/Divider';
import { Icon } from '../atoms/Icon';
import { HeaderIconButton } from '../molecules/HeaderIconButton';

export interface DashboardHeaderProps {
  title: string;
  dateSubtitle: string;
  userFullName: string;
  userRoleLabel: string;
  userEmail?: string;
  userIdentification?: string;
  userEstablishment?: string;
  userRoles?: string[];
  userPermissions?: string[];
  userPhotoUrl?: string | null;
  sessionRemainingSeconds?: number;
  isRefreshingToken?: boolean;
  alertCount?: number;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
  onSearchClick?: () => void;
  onRefreshSessionToken?: () => void;
  onOpenProfileSettings?: () => void;
  onLogout?: () => void;
  onGoToStore?: () => void;
  onOpenCustomerDisplay?: () => void;
}

/**
 * Organismo DashboardHeader:
 * Cabecera limpia estilo DealDeck con título grande, fecha a la izquierda,
 * botones circulares de acción y menú desplegable interactivo de perfil de usuario.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  dateSubtitle,
  userFullName,
  userRoleLabel,
  userEmail = 'admin@factuspos.com',
  userIdentification = 'CC 1020304050',
  userEstablishment = 'Sede Principal NatsarStore - Bogotá',
  userRoles = ['SUPER_ADMIN'],
  userPermissions = ['superAdmin:*'],
  userPhotoUrl = null,
  sessionRemainingSeconds = 300,
  isRefreshingToken = false,
  alertCount = 0,
  isSidebarVisible = true,
  onToggleSidebar,
  onRefresh,
  onSearchClick,
  onRefreshSessionToken,
  onOpenProfileSettings,
  onLogout,
  onGoToStore,
  onOpenCustomerDisplay,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const initials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const formatCountdown = (totalSeconds: number): string => {
    const safe = Math.max(0, totalSeconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isExpiringSoon = sessionRemainingSeconds <= 60;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarVisible ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            aria-label={isSidebarVisible ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              border: isSidebarVisible
                ? '1px solid rgba(226, 232, 240, 0.95)'
                : '1.5px solid #4D53F4',
              backgroundColor: isSidebarVisible ? '#FFFFFF' : '#EEF2FF',
              color: isSidebarVisible ? '#334155' : '#4D53F4',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.18s ease',
              flexShrink: 0,
            }}
          >
            <Icon name="menu" size={19} />
          </button>
        )}

        <div>
          <h1
            className="rsp-title"
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
      </div>

      <div
        className="rsp-header-right"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      >
        {onOpenCustomerDisplay && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCustomerDisplay}
            leftIcon={<Icon name="monitor" size={15} />}
            title="Abrir pantalla para el cliente en otra pantalla o pestaña"
            style={{
              borderRadius: '999px',
              backgroundColor: '#EEF2FF',
              borderColor: '#C7D2FE',
              color: '#4F55F1',
              fontWeight: 700,
            }}
          >
            Pantalla Cliente
          </Button>
        )}

        {onGoToStore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGoToStore}
            leftIcon={<Icon name="shopping-bag" size={15} />}
            style={{ borderRadius: '999px', backgroundColor: '#FFFFFF' }}
          >
            Tienda E-Commerce
          </Button>
        )}

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

        {/* Contenedor de Perfil de Usuario con Desplegable */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '6px 12px 6px 8px',
              borderRadius: '999px',
              backgroundColor: isDropdownOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
              border: isDropdownOpen
                ? '1.5px solid #4D53F4'
                : '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: isDropdownOpen
                ? '0 10px 24px -8px rgba(77, 83, 244, 0.22)'
                : '0 4px 12px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              textAlign: 'left',
            }}
          >
            {userPhotoUrl ? (
              <img
                src={userPhotoUrl}
                alt={userFullName}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 4px 10px rgba(77, 83, 244, 0.2)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4D53F4 0%, #818CF8 100%)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 6px 14px rgba(77, 83, 244, 0.25)',
                  flexShrink: 0,
                }}
              >
                {initials || 'NS'}
              </div>
            )}

            <div className="rsp-user-text" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {userFullName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: '#64748B',
                  }}
                >
                  {userRoleLabel}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isExpiringSoon ? '#FEF2F2' : '#EEF2FF',
                    color: isExpiringSoon ? '#DC2626' : '#4D53F4',
                  }}
                  title="Tiempo restante de sesión activa"
                >
                  {formatCountdown(sessionRemainingSeconds)}
                </span>
              </div>
            </div>

            <div
              style={{
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s ease',
                marginLeft: '2px',
              }}
            >
              <Icon name="chevron-down" size={16} />
            </div>
          </button>

          {/* Menú Desplegable con Información Completa del Usuario */}
          {isDropdownOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 'min(360px, calc(100vw - 32px))',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '20px',
                boxShadow:
                  '0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                animation: 'fadeInModal 0.16s ease-out',
              }}
            >
              {/* Cabecera del Perfil dentro del Desplegable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={userFullName}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #EEF2FF',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4D53F4 0%, #818CF8 100%)',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      boxShadow: '0 8px 18px rgba(77, 83, 244, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {initials || 'NS'}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#0F172A',
                      lineHeight: 1.25,
                    }}
                  >
                    {userFullName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#64748B',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userEmail}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <Badge tone="brand">{userRoleLabel}</Badge>
                    <Badge tone="success">Sesión Activa</Badge>
                  </div>
                </div>
              </div>

              <Divider margin="2px 0" />

              {/* Ficha Completa del Colaborador */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Identificación:</span>
                  <strong style={{ color: '#0F172A' }}>{userIdentification}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Sede POS:</span>
                  <strong style={{ color: '#0F172A', textAlign: 'right' }}>{userEstablishment}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Roles RBAC:</span>
                  <span style={{ fontWeight: 700, color: '#4D53F4' }}>{userRoles.join(', ')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Permisos:</span>
                  <span style={{ fontWeight: 600, color: '#047857' }}>
                    {userPermissions.includes('superAdmin:*')
                      ? 'Control Total (superAdmin:*)'
                      : `${userPermissions.length} permisos activos`}
                  </span>
                </div>
              </div>

              {/* Estado del Token & Botón de Refresh Token */}
              <div
                style={{
                  backgroundColor: isExpiringSoon ? '#FEF2F2' : '#EEF2FF',
                  border: `1px solid ${isExpiringSoon ? '#FECACA' : '#C7D2FE'}`,
                  borderRadius: '14px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isExpiringSoon ? '#991B1B' : '#3730A3',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Vigencia de Sesión
                  </div>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      color: isExpiringSoon ? '#DC2626' : '#4D53F4',
                      marginTop: '1px',
                    }}
                  >
                    Expira en {formatCountdown(sessionRemainingSeconds)}
                  </div>
                </div>

                {onRefreshSessionToken && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={isRefreshingToken}
                    onClick={() => onRefreshSessionToken()}
                    leftIcon={<Icon name="refresh" size={14} />}
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    Renovar
                  </Button>
                )}
              </div>

              {/* Botones Principales: Actualizar mis datos y Cerrar Sesión */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<Icon name="edit" size={16} />}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfileSettings?.();
                  }}
                >
                  Actualizar mis datos
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<Icon name="logout" size={16} />}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout?.();
                  }}
                  style={{
                    color: '#DC2626',
                    borderColor: '#FECACA',
                    backgroundColor: '#FFF5F5',
                  }}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
