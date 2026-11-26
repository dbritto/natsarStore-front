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
 * Tarjeta de Producto E-Commerce de Alta Intuición (Inspirada en el diseño de referencia)
 * Cuenta con:
 * - Micro-interacción inmediata al agregar (cambio a verde con checkmark ✓ durante 1.2s)
 * - Botón de "Vista rápida" al pasar el cursor (Desktop hover)
 * - Indicador de stock en tiempo real con punto pulsante
 * - Presentación limpia tipo editorial / skincare escandinavo
 */
export const EcommerceProductCard: React.FC<EcommerceProductProps> = ({
  name,
  description,
  formattedPrice,
  brand,
  primaryImageUrl,
  inStock,
  defaultTaxRate,
  onAddToCart,
  onOpenDetail,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const showImage = Boolean(primaryImageUrl) && !imageError;

  // Extraer información de formato o aroma a partir de la descripción (estilo "Cream, Fragrance-free, 200 ml")
  const formatSubtitle = description
    ? description.split('.')[0]
    : inStock
    ? 'Fórmula dermatológica certificada'
    : 'Temporalmente agotado';

  const handleClickCard = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else if (onAddToCart && inStock) {
      onAddToCart();
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) return;

    if (onAddToCart) {
      onAddToCart();
      setIsAddedRecently(true);
      setTimeout(() => setIsAddedRecently(false), 1200);
    } else if (onOpenDetail) {
      onOpenDetail();
    }
  };

  return (
    <div
      onClick={handleClickCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '12px 12px 16px',
        border: isHovered ? '1px solid #D4D1C9' : '1px solid #ECEAE4',
        boxShadow: isHovered
          ? '0 12px 28px rgba(24, 24, 27, 0.08), 0 2px 6px rgba(0,0,0,0.02)'
          : '0 4px 16px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        position: 'relative',
        boxSizing: 'border-box',
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
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
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
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
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

        {/* Badge de Marca / Categoría en la esquina superior izquierda */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            padding: '3px 9px',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#52525B',
            border: '1px solid rgba(0,0,0,0.05)',
            letterSpacing: '0.2px',
          }}
        >
          {brand ?? 'Factus'}
        </div>

        {/* Botón flotante 'Vista Rápida' al hacer hover */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              backgroundColor: 'rgba(24, 24, 27, 0.88)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <Icon name="eye" size={13} />
            <span>Vista rápida</span>
          </div>
        )}

        {/* Badge de stock si está agotado */}
        {!inStock && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.92)',
              color: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            Agotado
          </div>
        )}
      </div>

      {/* Textos y metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, padding: '0 4px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.04rem', fontWeight: 800, color: '#18181B' }}>
              {formattedPrice}
            </span>
          </div>
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
                boxShadow: inStock ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
              }}
            />
            {inStock ? 'Disponible' : 'Sin existencias'}
            {defaultTaxRate !== undefined && defaultTaxRate > 0 && (
              <span style={{ color: '#A1A1AA', fontSize: '0.68rem', marginLeft: '2px' }}>
                (IVA {defaultTaxRate}%)
              </span>
            )}
          </span>
        </div>

        {/* Botón circular '+' con micro-interacción a checkmark verde */}
        <button
          type="button"
          onClick={handlePlusClick}
          aria-label={
            isAddedRecently
              ? `${name} agregado a la bolsa`
              : `Añadir ${name} a la bolsa`
          }
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '999px',
            backgroundColor: isAddedRecently
              ? '#16A34A'
              : inStock
              ? '#18181B'
              : '#E4E4E7',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inStock ? 'pointer' : 'not-allowed',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isAddedRecently ? 'scale(1.12)' : 'scale(1)',
            boxShadow: isAddedRecently
              ? '0 4px 14px rgba(22, 163, 74, 0.4)'
              : inStock
              ? '0 3px 8px rgba(24,24,27,0.18)'
              : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (inStock && !isAddedRecently) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.backgroundColor = '#000000';
            }
          }}
          onMouseLeave={(e) => {
            if (inStock && !isAddedRecently) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#18181B';
            }
          }}
        >
          {isAddedRecently ? (
            <Icon name="check" size={17} />
          ) : (
            <Icon name="plus" size={17} />
          )}
        </button>
      </div>
    </div>
  );
};
