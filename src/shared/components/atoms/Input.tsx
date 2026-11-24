import React, { useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

/**
 * Átomo Input: Campo de entrada minimalista con soporte para slots laterales (iconos, botón ver contraseña)
 * y transición suave de foco corporativo.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftSlot, rightSlot, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = hasError
      ? 'var(--status-danger)'
      : focused
      ? 'var(--brand-primary)'
      : 'var(--border-input)';

    const boxShadow = hasError
      ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
      : focused
      ? '0 0 0 3.5px var(--brand-primary-soft)'
      : 'none';

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '48px',
          backgroundColor: focused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow,
          transition: 'all var(--transition-fast)',
          paddingLeft: leftSlot ? '14px' : '16px',
          paddingRight: rightSlot ? '12px' : '16px',
        }}
      >
        {leftSlot && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: focused ? 'var(--brand-primary)' : 'var(--text-muted)',
              marginRight: '10px',
              flexShrink: 0,
            }}
          >
            {leftSlot}
          </span>
        )}
        <input
          ref={ref}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            fontWeight: 400,
            ...style,
          }}
          {...rest}
        />
        {rightSlot && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: '8px',
              flexShrink: 0,
            }}
          >
            {rightSlot}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
