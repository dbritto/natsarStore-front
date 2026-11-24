import React, { useState } from 'react';
import {
  AlertBanner,
  AuthSplitTemplate,
  BrandLogo,
  Button,
  Divider,
  FormField,
  PasswordField,
  SocialAuthButton,
  SocialProvider,
  Typography,
} from '@shared/components';

export interface LoginPageProps {
  initialEmail: string;
  onSubmitLogin: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
}

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Auth)
 * Construido 100% ensamblando átomos, moléculas, organismos y plantillas desde `@shared/components`.
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  initialEmail,
  onSubmitLogin,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    const err = await onSubmitLogin(email, password, true);
    setIsLoading(false);
    if (err) {
      setErrorMessage(err);
    }
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    setErrorMessage(null);
    setInfoMessage(`El inicio de sesión con ${provider.toUpperCase()} requiere configuración de proveedor OAuth.`);
  };

  return (
    <AuthSplitTemplate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
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

        {errorMessage && (
          <AlertBanner
            tone="danger"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}

        {infoMessage && !errorMessage && (
          <AlertBanner
            tone="info"
            message={infoMessage}
            onClose={() => setInfoMessage(null)}
          />
        )}

        {/* Formulario de Autenticación */}
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
              onClick={() =>
                setInfoMessage('Comunícate con el administrador de NatsarStore para restablecer tu contraseña.')
              }
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
    </AuthSplitTemplate>
  );
};
