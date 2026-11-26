import React, { useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';

export interface EcommerceProductProps {
  id: string;
  name: string;
  codeReference: string;
  sku?: string | null;
  description?: string | null;
  basePrice: number;
  formattedPrice: string;
  categoryId?: string | null;
  brand?: string | null;
  primaryImageUrl?: string | null;
  inStock: boolean;
  defaultTaxRate?: number;
  barcodes?: Array<{ barcode: string }>;
  onAddToCart?: () => void;
  onOpenDetail?: () => void;
}

/**
 * Tarjeta de Producto E-Commerce (Inspirada en el diseño de referencia)
 * Presentación limpia tipo editorial/skincare:
 * Contenedor suave, imagen con render 3D / botánico, nombre, formato/aroma, precio y botón '+' circular.
 */
export const EcommerceProductCard: React.FC<EcommerceProductProps> = ({
  name,
  description,
  formattedPrice,
  primaryImageUrl,
  inStock,
  onAddToCart,
  onOpenDetail,
}) => {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(primaryImageUrl) && !imageError;

  // Extraer información de formato o aroma a partir de la descripción (estilo "Cream, Fragrance-free, 200 ml")
  const formatSubtitle = description
    ? description.split('.')[0]
    : inStock
    ? 'Disponible para compra inmediata'
    : 'Temporalmente agotado';

  const handleClickCard = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else if (onAddToCart) {
      onAddToCart();
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
    } else if (onOpenDetail) {
      onOpenDetail();
    }
  };

  return (
    <div
      onClick={handleClickCard}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '12px 12px 16px',
        border: '1px solid #ECEAE4',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(24, 24, 27, 0.08)';
        e.currentTarget.style.borderColor = '#D6D3CB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = '#ECEAE4';
      }}
    >
      {/* Contenedor de Imagen o Render 3D */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          minHeight: '160px',
          borderRadius: '18px',
          backgroundColor: '#F5F3ED',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {showImage ? (
          <img
            src={primaryImageUrl ?? ''}
            alt={name}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '12px',
              transition: 'transform 0.25s ease',
            }}
          />
        ) : (
          /* Render visual 3D minimalista inspirado en cosmética / envases */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #ECE9E1 85%)',
            }}
          >
            {/* Silueta de tarro / envase cosmético minimalista */}
            <div
              style={{
                width: '64px',
                height: '48px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1.5px solid #D6D3CB',
                boxShadow: '0 8px 18px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Tapa del tarro */}
              <div
                style={{
                  width: '68px',
                  height: '10px',
                  backgroundColor: name.toLowerCase().includes('balm') ? '#27272A' : '#E4E1DB',
                  borderRadius: '5px',
                  position: 'absolute',
                  top: '-7px',
                  border: '1px solid #C4C0B6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                }}
              />
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: '#52525B',
                  textTransform: 'uppercase',
                }}
              >
                Factus
              </span>
            </div>
            {/* Sombra proyectada */}
            <div
              style={{
                width: '56px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.06)',
                marginTop: '10px',
                filter: 'blur(2px)',
              }}
            />
          </div>
        )}

        {/* Badge de stock si está agotado */}
        {!inStock && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#71717A',
              border: '1px solid #E4E4E7',
            }}
          >
            Agotado
          </div>
        )}
      </div>

      {/* Textos y metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, padding: '0 4px' }}>
        <h3
          style={{
            fontSize: '0.96rem',
            fontWeight: 700,
            color: '#18181B',
            lineHeight: 1.25,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontSize: '0.78rem',
            color: '#71717A',
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {formatSubtitle}
        </p>
      </div>

      {/* Fila inferior: Precio, Estado de Stock y Botón circular '+' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 4px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#18181B' }}>
            {formattedPrice}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 500,
              color: inStock ? '#16A34A' : '#A1A1AA',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: inStock ? '#22C55E' : '#D4D4D8',
                display: 'inline-block',
              }}
            />
            {inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>

        {/* Botón circular '+' negro exacto a la imagen */}
        <button
          type="button"
          onClick={handlePlusClick}
          aria-label={`Añadir o ver detalle de ${name}`}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '999px',
            backgroundColor: inStock ? '#18181B' : '#E4E4E7',
            border: 'none',
            color: inStock ? '#FFFFFF' : '#A1A1AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inStock ? 'pointer' : 'not-allowed',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            boxShadow: inStock ? '0 3px 8px rgba(24,24,27,0.18)' : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (inStock) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.backgroundColor = '#000000';
            }
          }}
          onMouseLeave={(e) => {
            if (inStock) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#18181B';
            }
          }}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
};
