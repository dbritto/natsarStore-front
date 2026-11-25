import React, { useEffect } from 'react';
import { Icon } from '../atoms/Icon';

export interface DialogModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Molécula DialogModal (src/shared/components/molecules):
 * Ventana modal corporativa reutilizable para formularios CRUD, galerías y detalles.
 */
export const DialogModal: React.FC<DialogModalProps> = ({
  isOpen,
  title,
  subtitle,
  maxWidth = '640px',
  onClose,
  children,
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeInModal 160ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '22px 26px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.22rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#F4F6FB',
              border: 'none',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div
          style={{
            padding: '22px 26px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Pie opcional */}
        {footer && (
          <div
            style={{
              padding: '16px 26px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
