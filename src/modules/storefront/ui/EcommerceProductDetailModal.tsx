import React from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { EcommerceProductProps } from './EcommerceProductCard';

export interface EcommerceProductDetailModalProps {
  product: EcommerceProductProps | null;
  onClose: () => void;
  onAddToCart: (product: EcommerceProductProps) => void;
}

/**
 * Modal Detalle de Producto E-Commerce
 * Visualización limpia del artículo: imagen, precio, especificaciones, código de barras y desglose tributario DIAN.
 */
export const EcommerceProductDetailModal: React.FC<EcommerceProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

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
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          maxWidth: '540px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #ECEAE4',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
                color: '#71717A',
                backgroundColor: '#F4F2EC',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              {product.brand ?? 'Factus Store'}
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
              width: '32px',
              height: '32px',
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
        <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
          {/* Banner visual del producto */}
          <div
            style={{
              width: '100%',
              height: '200px',
              borderRadius: '20px',
              backgroundColor: '#F5F3ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
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
                    width: '72px',
                    height: '56px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1.5px solid #D6D3CB',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#18181B' }}>
                    FACTUS
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 500 }}>
                  Presentación de alta pureza
                </span>
              </div>
            )}
          </div>

          {/* Título y descripción */}
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#18181B',
              margin: '0 0 8px',
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              color: '#52525B',
              lineHeight: 1.5,
              margin: '0 0 18px',
            }}
          >
            {product.description ??
              'Producto seleccionado con estrictos estándares de calidad y trazabilidad fiscal DIAN.'}
          </p>

          {/* Ficha técnica compacta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              padding: '14px',
              backgroundColor: '#FAFAF9',
              borderRadius: '16px',
              border: '1px solid #ECEAE4',
              marginBottom: '20px',
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
                }}
              >
                {product.inStock ? 'En inventario' : 'Agotado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#71717A', display: 'block' }}>
                Impuesto DIAN
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18181B' }}>
                {product.defaultTaxRate ? `${product.defaultTaxRate}% IVA/INC` : 'Excluido 0%'}
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

          {/* Precio y botón de acción */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#71717A', display: 'block' }}>
                Precio unitario
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#18181B' }}>
                {product.formattedPrice}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              disabled={!product.inStock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '999px',
                backgroundColor: product.inStock ? '#18181B' : '#E4E4E7',
                color: product.inStock ? '#FFFFFF' : '#A1A1AA',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                boxShadow: product.inStock ? '0 4px 14px rgba(24,24,27,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (product.inStock) {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (product.inStock) {
                  e.currentTarget.style.backgroundColor = '#18181B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <Icon name="shopping-bag" size={16} />
              <span>Añadir a la bolsa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
