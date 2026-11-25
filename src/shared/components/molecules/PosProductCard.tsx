import React from 'react';
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
 * Tarjeta de producto táctil inspirada en interfaces POS modernas con botón circular '+'.
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
  return (
    <div
      onClick={onAddToCart}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '16px 14px 14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(77, 83, 244, 0.12)';
        e.currentTarget.style.borderColor = '#C7D2FE';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.03)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Ilustración / Miniatura Circular Central */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: isFoodOrDrink ? '#FEF3C7' : isHardware ? '#EEF2FF' : '#ECFDF5',
          color: isFoodOrDrink ? '#D97706' : isHardware ? '#4D53F4' : '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          fontSize: '1.9rem',
          boxShadow: '0 4px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        {primaryImageUrl ? (
          <img
            src={primaryImageUrl}
            alt={name}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : isFoodOrDrink ? (
          '☕'
        ) : isHardware ? (
          <Icon name="package" size={30} />
        ) : (
          <Icon name="sparkles" size={28} />
        )}
      </div>

      {/* Nombre & Impuesto */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.86rem',
            color: '#0F172A',
            lineHeight: 1.25,
            minHeight: '34px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            color: '#94A3B8',
            marginTop: '3px',
            display: 'inline-block',
          }}
        >
          {taxBadgeLabel}
        </span>
      </div>

      {/* Precio y Botón Circular '+' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#0F172A',
          }}
        >
          {formattedPrice}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#4D53F4',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(77, 83, 244, 0.3)',
            transition: 'transform 0.12s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          +
        </button>
      </div>
    </div>
  );
};
