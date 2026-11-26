import React, { useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { FormField } from '@shared/components/molecules/FormField';
import { PasswordField } from '@shared/components/molecules/PasswordField';
import { Checkbox } from '@shared/components/atoms/Checkbox';
import { Button } from '@shared/components/atoms/Button';

export interface EcommerceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLogin: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
  onNavigateToFullLoginPage?: () => void;
  initialEmail?: string;
}

/**
 * Modal de Acceso Rápido / Login para Tienda E-Commerce:
 * - Unificado con la identidad del Panel Administrativo: Royal Indigo (#4F55F1), bordes #E2E8F0
 * - Totalmente adaptado para móviles (sin desbordes ni botones sobrepuestos)
 */
export const EcommerceLoginModal: React.FC<EcommerceLoginModalProps> = ({
  isOpen,
  onClose,
  onSubmitLogin,
  onNavigateToFullLoginPage,
  initialEmail = 'admin@posy.com',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const err = await onSubmitLogin(email, password, rememberMe);
    setIsLoading(false);

    if (err) {
      setErrorMessage(err);
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 24px',
          position: 'relative',
          boxSizing: 'border-box',
          maxHeight: '92vh',
        }}
      >
        {/* Botón cerrar 'x' */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de login"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          <Icon name="x" size={15} />
        </button>

        {/* Encabezado con Icono Royal Indigo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#4F55F1',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 4px 12px rgba(79, 85, 241, 0.3)',
            }}
          >
            <Icon name="user" size={20} />
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}
          >
            Acceso a la Aplicación
          </h2>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#64748B',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Ingresa para gestionar el terminal POS, facturación electrónica DIAN e inventarios.
          </p>
        </div>

        {/* Banner de error */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#DC2626',
              fontSize: '0.8rem',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="alert" size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}
            >
              Correo Electrónico
            </label>
            <FormField
              type="email"
              placeholder="admin@posy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}
            >
              Contraseña
            </label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#64748B',
            }}
          >
            <Checkbox
              checked={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
              label="Recordar credenciales"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            style={{
              backgroundColor: '#4F55F1',
              borderRadius: '999px',
              padding: '11px',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(79, 85, 241, 0.3)',
            }}
          >
            Entrar al Panel POS
          </Button>

          {onNavigateToFullLoginPage && (
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFullLoginPage();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F55F1',
                  fontSize: '0.76rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '2px',
                  fontWeight: 600,
                }}
              >
                Abrir portal de inicio de sesión completo
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
