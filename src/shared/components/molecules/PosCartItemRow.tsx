import React, { useState } from 'react';
import { Icon } from '../atoms/Icon';

export interface PosCartItemRowProps {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
  isDrink?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/**
 * Molécula PosCartItemRow (Componente Bruto / Presentacional Puro)
 * Fila de la venta actual: imagen del producto, nombre, precio, stepper -/+, subtotal y eliminar.
 */
export const PosCartItemRow: React.FC<PosCartItemRowProps> = ({
  name,
  unitPrice,
  quantity,
  lineTotal,
  imageUrl,
  isDrink = false,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  const stepperButton: React.CSSProperties = {
    width: '22px',
    height: '22px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#475569',
    fontSize: '0.9rem',
    lineHeight: 1,
  };

  return (
    <div
      style={{
        padding: '10px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: '#F1F5F9',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '1.25rem',
        }}
      >
        {showImage ? (
          <img
            src={imageUrl ?? ''}
            alt={name}
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isDrink ? (
          '☕'
        ) : (
          '📦'
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.84rem',
            color: '#0F172A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={name}
        >
          {name}
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
          $ {unitPrice.toLocaleString('es-CO')}
        </span>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <button type="button" onClick={onDecrement} style={stepperButton} aria-label="Quitar uno">
          −
        </button>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
          {quantity}
        </span>
        <button type="button" onClick={onIncrement} style={stepperButton} aria-label="Agregar uno">
          +
        </button>
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: '0.84rem',
          color: '#0F172A',
          minWidth: '70px',
          textAlign: 'right',
        }}
      >
        $ {lineTotal.toLocaleString('es-CO')}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Eliminar de la venta"
        title="Eliminar de la venta"
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
};
