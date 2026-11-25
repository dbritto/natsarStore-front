import React from 'react';
import { Icon } from '../atoms/Icon';

export interface PosCartItemRowProps {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isDrink?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/**
 * Molécula PosCartItemRow (Componente Bruto / Presentacional Puro)
 * Fila de artículo en la canasta de venta con miniatura, nombre, controles - / + y botón de eliminar.
 */
export const PosCartItemRow: React.FC<PosCartItemRowProps> = ({
  name,
  unitPrice,
  quantity,
  lineTotal,
  isDrink = false,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '14px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Miniatura visual */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: '#EEF2FF',
          color: '#4D53F4',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.85rem',
          flexShrink: 0,
        }}
      >
        {isDrink ? '☕' : '📦'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
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
        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
          $ {unitPrice.toLocaleString('es-CO')}
        </span>
      </div>

      {/* Controles de Cantidad - / + */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={onDecrement}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          -
        </button>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          +
        </button>
      </div>

      {/* Subtotal del renglón */}
      <div
        style={{
          fontWeight: 800,
          fontSize: '0.86rem',
          color: '#0F172A',
          minWidth: '72px',
          textAlign: 'right',
        }}
      >
        $ {lineTotal.toLocaleString('es-CO')}
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={onRemove}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
        title="Eliminar de la venta"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
};
