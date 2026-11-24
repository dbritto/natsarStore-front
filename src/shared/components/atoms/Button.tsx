import React from 'react';

export type ButtonVariant = 'primary' | 'primary-pill' | 'outline' | 'subtle' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Átomo Button: Botón corporativo reutilizable sin duplicación de estilos.
 * Soporta tanto el botón redondeado moderno (Imagen 2) como el pill corporativo oscuro (Imagen 1).
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...rest
}) => {
  const heightMap: Record<ButtonSize, string> = {
    sm: '36px',
    md: '46px',
    lg: '50px',
  };

  const paddingMap: Record<ButtonSize, string> = {
    sm: '0 14px',
    md: '0 20px',
    lg: '0 24px',
  };

  const fontSizeMap: Record<ButtonSize, string> = {
    sm: '0.82rem',
    md: '0.92rem',
    lg: '0.96rem',
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--brand-primary)',
          color: '#FFFFFF',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 20px -4px var(--brand-glow)',
        };
      case 'primary-pill':
        return {
          backgroundColor: 'var(--brand-primary)',
          color: '#FFFFFF',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-pill)',
          boxShadow: '0 8px 18px -4px var(--brand-glow)',
        };
      case 'outline':
        return {
          backgroundColor: '#FFFFFF',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        };
      case 'subtle':
        return {
          backgroundColor: 'var(--brand-primary-soft)',
          color: 'var(--brand-primary)',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-md)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: fullWidth ? '100%' : 'auto',
        height: heightMap[size],
        padding: paddingMap[size],
        fontSize: fontSizeMap[size],
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
        ...getVariantStyles(),
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          style={{
            width: '17px',
            height: '17px',
            border: '2.2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.65s linear infinite',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
