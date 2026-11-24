import React, { useState } from 'react';
import { FormField, FormFieldProps } from './FormField';
import { Icon } from '../atoms/Icon';

export type PasswordFieldProps = Omit<FormFieldProps, 'type' | 'rightSlot'>;

/**
 * Molécula PasswordField: Campo de contraseña con botón de visibilidad (ojo) integrado,
 * fiel al diseño minimalista de las pantallas de referencia.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={visible ? 'eye' : 'eye-off'} size={18} />
        </button>
      }
      {...props}
    />
  );
});

PasswordField.displayName = 'PasswordField';
