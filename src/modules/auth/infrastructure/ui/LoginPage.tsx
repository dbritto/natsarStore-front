import React, { useState } from 'react';
import {
  AuthSplitTemplate,
  BrandLogo,
  Button,
  Divider,
  FormField,
  FriendlyModal,
  PasswordField,
  SocialAuthButton,
  SocialProvider,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';

export interface LoginPageProps {
  initialEmail: string;
  initialNotice?: FriendlyNotice | null;
  onClearInitialNotice?: () => void;
  onSubmitLogin: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
  onBackToStore?: () => void;
}

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Auth)
 * Presenta todos los avisos y errores suavizados a través de `FriendlyModal` de `@shared/components`,
 * sin mostrar errores crudos ni códigos de estado en el formulario.
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  initialEmail,
  initialNotice = null,
  onClearInitialNotice,
  onSubmitLogin,
  onBackToStore,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalNotice, setModalNotice] = useState<FriendlyNotice | null>(initialNotice);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const err = await onSubmitLogin(email, password, true);
    setIsLoading(false);
    if (err) {
      setModalNotice(FriendlyErrorMapper.toFriendlyNotice(err));
    }
  };

  const handleSocialLogin = (_provider: SocialProvider) => {
    setModalNotice({
      title: 'Servicio no disponible temporalmente',
      message:
        'En estos momentos este servicio no se encuentra disponible. Puedes iniciar sesión directamente con tu correo electrónico y contraseña.',
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const handleForgotPassword = () => {
    setModalNotice({
      title: 'Recuperación de contraseña',
      message:
        'Por políticas de seguridad corporativa, comunícate con el administrador de NatsarStore para que te asigne una nueva clave de acceso.',
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  return (
    <AuthSplitTemplate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {onBackToStore && (
          <div style={{ alignSelf: 'flex-start', marginBottom: '-8px' }}>
            <button
              type="button"
              onClick={onBackToStore}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span>←</span>
              <span>Volver a la Tienda</span>
            </button>
          </div>
        )}
        {/* Cabecera con Logo NatsarStore y Bienvenida */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <BrandLogo size="md" />

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Typography
              as="h1"
              variant="h1"
              align="center"
              style={{ fontSize: '1.75rem', fontWeight: 800 }}
            >
              Bienvenido de Nuevo
            </Typography>

            <Typography
              variant="caption"
              tone="muted"
              align="center"
              style={{ marginTop: '4px', fontSize: '0.84rem' }}
            >
              Por favor inicia sesión en tu cuenta
            </Typography>
          </div>
        </div>

        {/* Formulario de Autenticación (sin errores crudos inline) */}
        <form
          onSubmit={handleFormSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <FormField
            id="login-email"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <PasswordField
            id="login-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            style={{ marginTop: '4px' }}
          >
            Iniciar Sesión
          </Button>
        </form>

        <Divider label="o Ingresa con" margin="4px 0" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <SocialAuthButton
            provider="facebook"
            label="Facebook"
            shape="rounded"
            onClick={handleSocialLogin}
          />
          <SocialAuthButton
            provider="google"
            label="Google"
            shape="rounded"
            onClick={handleSocialLogin}
          />
        </div>
      </div>

      {/* Modal compartido para suavizar errores y avisos al cliente */}
      <FriendlyModal
        isOpen={Boolean(modalNotice || initialNotice)}
        title={(modalNotice ?? initialNotice)?.title ?? ''}
        message={(modalNotice ?? initialNotice)?.message ?? ''}
        tone={(modalNotice ?? initialNotice)?.tone}
        actionLabel={(modalNotice ?? initialNotice)?.actionLabel}
        onClose={() => {
          setModalNotice(null);
          onClearInitialNotice?.();
        }}
      />
    </AuthSplitTemplate>
  );
};
