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
 * Modal de Acceso Rápido / Login para Tienda E-Commerce
 * Permite a cajeros, administradores y personal acceder a la aplicación directamente
 * desde el botón de login situado en la parte superior derecha.
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.48)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '30px',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid #ECEAE4',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 28px',
          position: 'relative',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Botón cerrar 'x' */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de login"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#F4F4F5',
            color: '#71717A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E4E4E7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F4F4F5';
          }}
        >
          <Icon name="x" size={16} />
        </button>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '999px',
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Icon name="user" size={22} />
          </div>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#18181B',
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
            }}
          >
            Acceso a la Aplicación
          </h2>
          <p
            style={{
              fontSize: '0.84rem',
              color: '#71717A',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Ingresa con tus credenciales para acceder al terminal POS, inventario y facturación electrónica.
          </p>
        </div>

        {/* Banner de error si las credenciales fallan */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#DC2626',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Icon name="alert" size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#3F3F46',
                marginBottom: '6px',
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
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#3F3F46',
                marginBottom: '6px',
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
              fontSize: '0.8rem',
              color: '#71717A',
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
              backgroundColor: '#18181B',
              borderRadius: '999px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '0.92rem',
              marginTop: '8px',
            }}
          >
            Entrar a la Aplicación
          </Button>

          {onNavigateToFullLoginPage && (
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFullLoginPage();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717A',
                  fontSize: '0.78rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px',
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
