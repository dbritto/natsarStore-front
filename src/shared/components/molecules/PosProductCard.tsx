import React, { useState } from 'react';
import { Icon } from '../atoms/Icon';

export interface PosProductCardProps {
  id: string;
  name: string;
  formattedPrice: string;
  taxBadgeLabel: string;
  codeReference?: string;
  primaryImageUrl?: string | null;
  isFoodOrDrink?: boolean;
  isHardware?: boolean;
  onAddToCart: () => void;
}

/**
 * Molécula PosProductCard (Componente Bruto / Presentacional Puro)
 * Tarjeta de producto con imagen cuadrada redondeada, nombre, precio y botón '+'.
 * Si el producto no tiene imagen (o falla al cargar) muestra un ícono de respaldo.
 */
export const PosProductCard: React.FC<PosProductCardProps> = ({
  name,
  formattedPrice,
  taxBadgeLabel,
  primaryImageUrl,
  isFoodOrDrink = false,
  isHardware = false,
  onAddToCart,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(primaryImageUrl) && !imageFailed;

  return (
    <div
      onClick={onAddToCart}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        padding: '10px',
        border: '1px solid #E8ECF4',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 22px rgba(77, 83, 244, 0.12)';
        e.currentTarget.style.borderColor = '#C7D2FE';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#E8ECF4';
      }}
    >
      {/* Imagen del producto */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: isFoodOrDrink ? '#FEF3C7' : isHardware ? '#EEF2FF' : '#ECFDF5',
          color: isFoodOrDrink ? '#D97706' : isHardware ? '#4D53F4' : '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.4rem',
        }}
      >
        {showImage ? (
          <img
            src={primaryImageUrl ?? ''}
            alt={name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isFoodOrDrink ? (
          '☕'
        ) : isHardware ? (
          <Icon name="package" size={38} />
        ) : (
          <Icon name="image" size={36} />
        )}
      </div>

      {/* Nombre y precio con botón '+' */}
      <div style={{ padding: '0 2px 2px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.82rem',
            color: '#1E293B',
            lineHeight: 1.25,
            minHeight: '32px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={name}
        >
          {name}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '6px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#0F172A',
                lineHeight: 1.1,
              }}
            >
              {formattedPrice}
            </div>
            <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>{taxBadgeLabel}</span>
          </div>

          <button
            type="button"
            aria-label={`Agregar ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4D53F4',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(77, 83, 244, 0.3)',
            }}
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
