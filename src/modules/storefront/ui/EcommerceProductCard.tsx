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
 * Tarjeta de Producto E-Commerce Unificada con el Panel Administrativo:
 * - Colores coherentes: Royal Indigo (#4F55F1), bordes #E2E8F0, estados #10B981
 * - 100% Mobile Safe: Proporciones balanceadas en pantallas pequeñas sin sobreposición de botones ni cortes
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

  const formatSubtitle = description
    ? description.split('.')[0]
    : inStock
    ? 'Disponible para facturación inmediata'
    : 'Agotado temporalmente';

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
      className="storefront-product-card"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: isHovered ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
        boxShadow: isHovered
          ? '0 10px 24px rgba(15, 23, 42, 0.08)'
          : '0 2px 8px rgba(15, 23, 42, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Contenedor de Imagen o Render de Producto */}
      <div
        className="storefront-card-image-box"
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '14px',
          backgroundColor: '#F8FAFC',
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
              padding: '10px',
              transition: 'transform 0.25s ease',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          /* Placeholder corporativo limpio */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #EEF2F6 90%)',
              padding: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 85, 241, 0.08)',
                color: '#4F55F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="package" size={24} />
            </div>
          </div>
        )}

        {/* Badge de Marca / Sede en la esquina superior izquierda */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(4px)',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '0.64rem',
            fontWeight: 700,
            color: '#475569',
            border: '1px solid #E2E8F0',
            letterSpacing: '0.2px',
            maxWidth: '75%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {brand ?? 'NatsarStore'}
        </div>

        {/* Badge de stock si está agotado */}
        {!inStock && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              padding: '2px 7px',
              borderRadius: '999px',
              fontSize: '0.62rem',
              fontWeight: 700,
            }}
          >
            Agotado
          </div>
        )}
      </div>

      {/* Textos y metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, padding: '0 2px' }}>
        <h3
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.25,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.2em',
          }}
        >
          {name}
        </h3>
        <p
          className="storefront-card-desc"
          style={{
            fontSize: '0.74rem',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {formatSubtitle}
        </p>
      </div>

      {/* Fila inferior: Precio y Botón circular '+' (sin sobreposición) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          paddingTop: '2px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formattedPrice}
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: inStock ? '#10B981' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: inStock ? '#10B981' : '#CBD5E1',
                flexShrink: 0,
              }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inStock ? 'En stock' : 'Sin stock'}
            </span>
          </span>
        </div>

        {/* Botón circular '+' con color Royal Indigo (#4F55F1) o Verde Éxito (#10B981) */}
        <button
          type="button"
          onClick={handlePlusClick}
          aria-label={
            isAddedRecently
              ? `${name} añadido a la bolsa`
              : `Añadir ${name} a la bolsa`
          }
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isAddedRecently
              ? '#10B981'
              : inStock
              ? '#4F55F1'
              : '#E2E8F0',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inStock ? 'pointer' : 'not-allowed',
            transition: 'all 0.16s ease',
            transform: isAddedRecently ? 'scale(1.1)' : 'scale(1)',
            boxShadow: inStock && !isAddedRecently ? '0 2px 8px rgba(79, 85, 241, 0.3)' : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (inStock && !isAddedRecently) {
              e.currentTarget.style.backgroundColor = '#3F44D9';
            }
          }}
          onMouseLeave={(e) => {
            if (inStock && !isAddedRecently) {
              e.currentTarget.style.backgroundColor = '#4F55F1';
            }
          }}
        >
          {isAddedRecently ? (
            <Icon name="check" size={15} />
          ) : (
            <Icon name="plus" size={15} />
          )}
        </button>
      </div>

      <style>{`
        .storefront-product-card {
          padding: 12px;
        }
        @media (max-width: 640px) {
          .storefront-product-card {
            padding: 8px 8px 10px !important;
            border-radius: 16px !important;
            gap: 6px !important;
          }
          .storefront-card-desc {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
