import React from 'react';
import { CorporateShowcaseHero } from '../organisms/CorporateShowcaseHero';

export interface AuthSplitTemplateProps {
  children: React.ReactNode;
}

/**
 * Template AuthSplitTemplate (Atomic Design):
 * Plantilla de autenticación minimalista corporativa con tarjeta visual redondeada a la izquierda
 * y formulario limpio a la derecha.
 */
export const AuthSplitTemplate: React.FC<AuthSplitTemplateProps> = ({ children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#EEF1F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <main
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          boxShadow: 'var(--shadow-card)',
          padding: '22px',
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 420px) 1fr',
          overflow: 'hidden',
        }}
      >
        {/* Resplandor decorativo superior derecho */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-55px',
            right: '-45px',
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.24) 0%, rgba(99, 102, 241, 0.08) 55%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        <aside>
          <CorporateShowcaseHero />
        </aside>

        <section
          style={{
            padding: '34px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
};
