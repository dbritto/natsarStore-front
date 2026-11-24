import React from 'react';
import { SidebarNav, WorkspaceSectionId } from '../organisms/SidebarNav';
import { DashboardHeader } from '../organisms/DashboardHeader';

export interface WorkspaceShellTemplateProps {
  activeSection?: WorkspaceSectionId;
  onSelectSection?: (section: WorkspaceSectionId) => void;
  pageTitle?: string;
  dateSubtitle?: string;
  userFullName: string;
  userRoleLabel?: string;
  userEmail?: string;
  primaryRole?: string;
  isSuperAdmin?: boolean;
  alertCount?: number;
  onRefresh?: () => void;
  onSearchClick?: () => void;
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
  primaryRole,
  alertCount = 0,
  onRefresh,
  onSearchClick,
  onLogout,
  children,
}) => {
  const effectiveRole = userRoleLabel || primaryRole || 'Operador';
  const effectiveDateSubtitle = dateSubtitle || userEmail || new Date().toLocaleDateString('es-CO', {
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
        gap: '28px',
        alignItems: 'flex-start',
      }}
    >
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        alertCount={alertCount}
        onLogout={onLogout}
      />

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
          alertCount={alertCount}
          onRefresh={onRefresh}
          onSearchClick={onSearchClick}
        />

        <main style={{ width: '100%' }}>{children}</main>
      </div>
    </div>
  );
};
