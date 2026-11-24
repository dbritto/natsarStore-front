import React from 'react';
import { Input, InputProps } from '../atoms/Input';

export interface FormFieldProps extends InputProps {
  label?: string;
  errorMessage?: string;
  helperText?: string;
  rightLabelSlot?: React.ReactNode;
}

/**
 * Molécula FormField: Agrupa etiqueta corporativa, campo Input y mensaje de validación.
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, errorMessage, helperText, rightLabelSlot, id, ...inputProps }, ref) => {
    const hasError = Boolean(errorMessage) || inputProps.hasError;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%' }}>
        {(label || rightLabelSlot) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {label && (
              <label
                htmlFor={id}
                style={{
                  fontSize: '0.81rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.005em',
                }}
              >
                {label}
              </label>
            )}
            {rightLabelSlot}
          </div>
        )}

        <Input ref={ref} id={id} hasError={hasError} {...inputProps} />

        {errorMessage ? (
          <span
            role="alert"
            style={{
              fontSize: '0.76rem',
              fontWeight: 500,
              color: 'var(--status-danger)',
            }}
          >
            {errorMessage}
          </span>
        ) : helperText ? (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
