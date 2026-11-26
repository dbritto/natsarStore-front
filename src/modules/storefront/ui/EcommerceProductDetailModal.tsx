import React, { useEffect, useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { EcommerceProductProps } from './EcommerceProductCard';

export interface EcommerceProductDetailModalProps {
  product: EcommerceProductProps | null;
  onClose: () => void;
  onAddToCart: (product: EcommerceProductProps, quantity?: number) => void;
}

/**
 * Modal Detalle de Producto E-Commerce de Alta Conversión
 * Diseñado bajo estándares de Apple Store y Aesop:
 * - Selector interactivo de cantidad
 * - Botón principal con precio total dinámico y micro-animación
 * - Sellos de confianza (Facturación DIAN, Envío y Garantía)
 * - Ficha técnica y trazabilidad de inventario
 * - Soporte para tecla Escape y cierre accesible
 */
export const EcommerceProductDetailModal: React.FC<EcommerceProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reiniciar cantidad cada vez que cambia el producto
  useEffect(() => {
    setQuantity(1);
    setJustAdded(false);
  }, [product?.id]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const totalPrice = product.basePrice * quantity;
  const formattedTotalPrice =
    totalPrice < 1000
      ? `$${totalPrice}`
      : `$${totalPrice.toLocaleString('es-CO')}`;

  const handleAdd = () => {
    if (!product.inStock) return;
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 700);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #ECEAE4',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Encabezado del modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#52525B',
                backgroundColor: '#F4F2EC',
                padding: '4px 12px',
                borderRadius: '999px',
              }}
            >
              {product.brand ?? 'Factus Oficial'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>
              Ref: {product.codeReference}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#F4F4F5',
              color: '#71717A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E4E4E7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F4F4F5';
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div style={{ padding: '0 24px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Banner visual del producto con iluminación radial */}
          <div
            style={{
              width: '100%',
              height: '210px',
              borderRadius: '24px',
              backgroundColor: '#F5F3ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {product.primaryImageUrl ? (
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '60px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #D6D3CB',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#18181B' }}>
                    FACTUS
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 500 }}>
                  Presentación de grado clínico y cosmético
                </span>
              </div>
            )}
          </div>

          {/* Título, precio individual y descripción */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', margin: '0 0 8px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#18181B',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h2>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#18181B', flexShrink: 0 }}>
              {product.formattedPrice}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.88rem',
              color: '#52525B',
              lineHeight: 1.5,
              margin: '0 0 18px',
            }}
          >
            {product.description ??
              'Fórmula dermatológica y producto comercializado con certificación y trazabilidad fiscal DIAN bajo normativa vigente colombiana.'}
          </p>

          {/* Ficha técnica compacta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              padding: '14px',
              backgroundColor: '#FAFAF9',
              borderRadius: '18px',
              border: '1px solid #ECEAE4',
              marginBottom: '18px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: '#71717A', display: 'block' }}>
                Disponibilidad
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: product.inStock ? '#16A34A' : '#EF4444',
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
                    backgroundColor: product.inStock ? '#22C55E' : '#EF4444',
                  }}
                />
                {product.inStock ? 'En inventario' : 'Agotado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#71717A', display: 'block' }}>
                Régimen DIAN
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18181B' }}>
                {product.defaultTaxRate ? `${product.defaultTaxRate}% IVA/INC Incluido` : 'Excluido 0%'}
              </span>
            </div>

            {product.sku && (
              <div>
                <span style={{ fontSize: '0.7rem', color: '#71717A', display: 'block' }}>
                  SKU
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18181B' }}>
                  {product.sku}
                </span>
              </div>
            )}

            {product.barcodes && product.barcodes.length > 0 && (
              <div>
                <span style={{ fontSize: '0.7rem', color: '#71717A', display: 'block' }}>
                  Código de Barras
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18181B' }}>
                  {product.barcodes[0].barcode}
                </span>
              </div>
            )}
          </div>

          {/* Sellos de garantía y confianza */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '16px',
              backgroundColor: '#F5F3ED',
              marginBottom: '18px',
              fontSize: '0.78rem',
              color: '#52525B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="receipt" size={15} style={{ color: '#F97316' }} />
              <span>Factura electrónica oficial DIAN con CUFE y QR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="truck" size={15} style={{ color: '#18181B' }} />
              <span>Despacho seguro y trazabilidad en tiempo real</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="shield" size={15} style={{ color: '#16A34A' }} />
              <span>Garantía de calidad y originalidad de producto</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acción y Selector de Cantidad */}
        <div
          style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid #ECEAE4',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          {/* Selector de cantidad */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F5F4F0',
              borderRadius: '999px',
              padding: '4px 8px',
              border: '1px solid #E5E3DB',
            }}
          >
            <button
              type="button"
              disabled={quantity <= 1 || !product.inStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FFFFFF',
                cursor: quantity <= 1 || !product.inStock ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                color: '#18181B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                minWidth: '24px',
                textAlign: 'center',
                color: '#18181B',
              }}
            >
              {quantity}
            </span>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar cantidad"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FFFFFF',
                cursor: !product.inStock ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                color: '#18181B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          {/* Botón CTA principal */}
          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '999px',
              backgroundColor: justAdded
                ? '#16A34A'
                : product.inStock
                ? '#18181B'
                : '#E4E4E7',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: product.inStock
                ? '0 4px 16px rgba(24, 24, 27, 0.2)'
                : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            {justAdded ? (
              <>
                <Icon name="check" size={18} />
                <span>¡Agregado a la bolsa!</span>
              </>
            ) : product.inStock ? (
              <>
                <Icon name="shopping-bag" size={17} />
                <span>
                  Añadir {quantity > 1 ? `(${quantity})` : ''} • {formattedTotalPrice}
                </span>
              </>
            ) : (
              <span>Agotado temporalmente</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
