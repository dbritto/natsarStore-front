import React from 'react';
import { TopNavbar, TopNavbarProps } from '../organisms/TopNavbar';

export interface WorkspaceShellTemplateProps extends TopNavbarProps {
  children: React.ReactNode;
}

/**
 * Template WorkspaceShellTemplate (Atomic Design):
 * Estructura base minimalista y corporativa para las vistas operativas de NatsarStore.
 */
export const WorkspaceShellTemplate: React.FC<WorkspaceShellTemplateProps> = ({
  children,
  ...navbarProps
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopNavbar {...navbarProps} />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1260px',
          margin: '0 auto',
          padding: '28px 24px 48px',
        }}
      >
        {children}
      </main>
    </div>
  );
};
