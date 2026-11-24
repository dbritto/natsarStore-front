import React from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export type SocialProvider = 'google' | 'facebook' | 'microsoft';

export interface SocialAuthButtonProps {
  provider: SocialProvider;
  label?: string;
  shape?: 'rounded' | 'pill';
  onClick?: (provider: SocialProvider) => void;
}

/**
 * Molécula SocialAuthButton: Botón de autenticación federada reutilizable (Google / Facebook / Microsoft).
 */
export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  provider,
  label,
  shape = 'rounded',
  onClick,
}) => {
  const defaultLabels: Record<SocialProvider, string> = {
    google: 'Google',
    facebook: 'Facebook',
    microsoft: 'Microsoft',
  };

  return (
    <Button
      type="button"
      variant="outline"
      fullWidth
      onClick={() => onClick?.(provider)}
      leftIcon={<Icon name={provider} size={18} />}
      style={{
        height: '44px',
        fontSize: '0.84rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-md)',
      }}
    >
      {label ?? defaultLabels[provider]}
    </Button>
  );
};
