import React, { useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Icon, IconName } from '../atoms/Icon';
import { FriendlyNoticeTone } from '@shared/domain/FriendlyErrorMapper';

export interface FriendlyModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  tone?: FriendlyNoticeTone;
  actionLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

/**
 * Molécula FriendlyModal (src/shared/components/molecules):
 * Modal corporativo minimalista para presentar avisos, errores suavizados y confirmaciones al usuario final.
 */
export const FriendlyModal: React.FC<FriendlyModalProps> = ({
  isOpen,
  title,
  message,
  tone = 'warning',
  actionLabel = 'Entendido',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toneConfig: Record<
    FriendlyNoticeTone,
    { iconBg: string; iconRing: string; iconColor: string; iconName: IconName }
  > = {
    warning: {
      iconBg: '#EEF2FF',
      iconRing: 'rgba(79, 85, 241, 0.14)',
      iconColor: '#4F55F1',
      iconName: 'shield',
    },
    info: {
      iconBg: '#F0FDF4',
      iconRing: 'rgba(16, 185, 129, 0.14)',
      iconColor: '#059669',
      iconName: 'sparkles',
    },
    danger: {
      iconBg: '#FFF1F2',
      iconRing: 'rgba(244, 63, 94, 0.14)',
      iconColor: '#E11D48',
      iconName: 'alert',
    },
  };

  const current = toneConfig[tone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="friendly-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
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
          maxWidth: '410px',
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          padding: '30px 28px 26px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 4px 16px -4px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          position: 'relative',
        }}
      >
        {/* Ícono suave con doble halo */}
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            backgroundColor: current.iconBg,
            boxShadow: `0 0 0 8px ${current.iconRing}`,
            color: current.iconColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}
        >
          <Icon name={current.iconName} size={26} />
        </div>

        {/* Título Amigable */}
        <h3
          id="friendly-modal-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.22rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>

        {/* Mensaje Empático sin códigos ni errores técnicos */}
        <p
          style={{
            fontSize: '0.89rem',
            color: '#475569',
            lineHeight: 1.58,
            maxWidth: '340px',
          }}
        >
          {message}
        </p>

        {/* Botones de Acción */}
        <div style={{ width: '100%', marginTop: '6px', display: 'flex', gap: '10px' }}>
          {onConfirm ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="md"
                fullWidth
                onClick={onClose}
              >
                {cancelLabel || 'Cancelar'}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={onConfirm}
              >
                {confirmLabel || actionLabel}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
