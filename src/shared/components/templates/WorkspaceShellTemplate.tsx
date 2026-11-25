import React, { useState } from 'react';
import { SidebarNav, WorkspaceSectionId } from '../organisms/SidebarNav';
import { DashboardHeader } from '../organisms/DashboardHeader';

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
  children: React.ReactNode;
}

/**
 * Template WorkspaceShellTemplate (Atomic Design):
 * Layout corporativo minimalista con Sidebar blanca redondeada a la izquierda
 * y área de contenido Bento Grid a la derecha, fiel a la referencia DealDeck.
 */
export const WorkspaceShellTemplate: React.FC<WorkspaceShellTemplateProps> = ({
  activeSection = 'dashboard',
  onSelectSection = () => {},
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
  children,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_VISIBILITY_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
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
        gap: isSidebarVisible ? '28px' : '0px',
        alignItems: 'flex-start',
        transition: 'gap 0.22s ease',
      }}
    >
      {isSidebarVisible && (
        <SidebarNav
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          alertCount={alertCount}
          onLogout={onLogout}
          onHideSidebar={handleToggleSidebar}
        />
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
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={handleToggleSidebar}
          onRefresh={onRefresh}
          onSearchClick={onSearchClick}
          onRefreshSessionToken={onRefreshSessionToken}
          onOpenProfileSettings={onOpenProfileSettings}
          onLogout={onLogout}
        />

        <main style={{ width: '100%' }}>{children}</main>
      </div>
    </div>
  );
};
