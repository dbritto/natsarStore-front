import React, { useEffect, useState } from 'react';
import { SidebarNav, WorkspaceSectionId } from '../organisms/SidebarNav';
import { DashboardHeader } from '../organisms/DashboardHeader';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const SIDEBAR_VISIBILITY_KEY = 'natsar_pos_sidebar_visible_v1';

export interface WorkspaceShellTemplateProps {
  activeSection?: WorkspaceSectionId;
  onSelectSection?: (section: WorkspaceSectionId) => void;
  pageTitle?: string;
  dateSubtitle?: string;
  userFullName: string;
  userRoleLabel?: string;
  userEmail?: string;
  userIdentification?: string;
  userEstablishment?: string;
  userRoles?: string[];
  userPermissions?: string[];
  userPhotoUrl?: string | null;
  sessionRemainingSeconds?: number;
  isRefreshingToken?: boolean;
  primaryRole?: string;
  isSuperAdmin?: boolean;
  alertCount?: number;
  onRefresh?: () => void;
  onSearchClick?: () => void;
  onRefreshSessionToken?: () => void;
  onOpenProfileSettings?: () => void;
  onLogout: () => void;
  onGoToStore?: () => void;
  children: React.ReactNode;
}

/**
 * Template WorkspaceShellTemplate (Atomic Design):
 * Layout corporativo con Sidebar a la izquierda y contenido a la derecha.
 * En tablet y móvil (≤ 1100px) la barra lateral se convierte en un cajón deslizable
 * que se abre desde el botón de menú y se cierra al elegir una sección.
 */
export const WorkspaceShellTemplate: React.FC<WorkspaceShellTemplateProps> = ({
  activeSection = 'dashboard',
  onSelectSection = () => { },
  pageTitle = 'Panel Operativo POS',
  dateSubtitle,
  userFullName,
  userRoleLabel,
  userEmail,
  userIdentification,
  userEstablishment,
  userRoles,
  userPermissions,
  userPhotoUrl,
  sessionRemainingSeconds,
  isRefreshingToken,
  primaryRole,
  alertCount = 0,
  onRefresh,
  onSearchClick,
  onRefreshSessionToken,
  onOpenProfileSettings,
  onLogout,
  onGoToStore,
  children,
}) => {
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_VISIBILITY_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!isCompact) setIsDrawerOpen(false);
  }, [isCompact]);

  useEffect(() => {
    if (!isCompact || !isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCompact, isDrawerOpen]);

  const handleToggleSidebar = () => {
    if (isCompact) {
      setIsDrawerOpen((prev) => !prev);
      return;
    }
    setIsSidebarVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_VISIBILITY_KEY, String(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return next;
    });
  };

  const handleSelectSection = (section: WorkspaceSectionId) => {
    onSelectSection(section);
    if (isCompact) setIsDrawerOpen(false);
  };

  const sidebarVisible = isCompact ? isDrawerOpen : isSidebarVisible;

  const effectiveRole = userRoleLabel || primaryRole || 'Operador';
  const effectiveDateSubtitle =
    dateSubtitle ||
    userEmail ||
    new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F2F4F9',
        padding: '22px 26px',
        display: 'flex',
        gap: !isCompact && isSidebarVisible ? '28px' : '0px',
        alignItems: 'flex-start',
        transition: 'gap 0.22s ease',
      }}
    >
      {/* Escritorio: barra lateral fija */}
      {!isCompact && isSidebarVisible && (
        <SidebarNav
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          alertCount={alertCount}
          onLogout={onLogout}
          onHideSidebar={handleToggleSidebar}
        />
      )}

      {/* Tablet / Móvil: cajón deslizable con fondo oscurecido */}
      {isCompact && isDrawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex' }}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div
            style={{
              width: 'min(300px, 86vw)',
              height: '100%',
              animation: 'fadeInModal 160ms ease-out',
              boxShadow: '0 0 40px rgba(15, 23, 42, 0.3)',
            }}
          >
            <SidebarNav
              isDrawer
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              alertCount={alertCount}
              onLogout={onLogout}
              onHideSidebar={handleToggleSidebar}
            />
          </div>
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(3px)',
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DashboardHeader
          title={pageTitle}
          dateSubtitle={effectiveDateSubtitle}
          userFullName={userFullName}
          userRoleLabel={effectiveRole}
          userEmail={userEmail}
          userIdentification={userIdentification}
          userEstablishment={userEstablishment}
          userRoles={userRoles}
          userPermissions={userPermissions}
          userPhotoUrl={userPhotoUrl}
          sessionRemainingSeconds={sessionRemainingSeconds}
          isRefreshingToken={isRefreshingToken}
          alertCount={alertCount}
          isSidebarVisible={sidebarVisible}
          onToggleSidebar={handleToggleSidebar}
          onRefresh={onRefresh}
          onSearchClick={onSearchClick}
          onRefreshSessionToken={onRefreshSessionToken}
          onOpenProfileSettings={onOpenProfileSettings}
          onLogout={onLogout}
          onGoToStore={onGoToStore}
        />

        <main style={{ width: '100%', minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
};
