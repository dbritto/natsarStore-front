import React, { useEffect, useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { EcommerceProductProps } from './EcommerceProductCard';

export interface EcommerceProductDetailModalProps {
  product: EcommerceProductProps | null;
  onClose: () => void;
  onAddToCart: (product: EcommerceProductProps, quantity?: number) => void;
}

/**
 * Modal Detalle de Producto E-Commerce Unificado con el Panel Administrativo:
 * - Colores corporativos: Royal Indigo (#4F55F1), bordes #E2E8F0, verde éxito #10B981
 * - 100% Mobile Safe: Ajuste de altura responsivo, botones que no se sobreponen ni cortan
 */
export const EcommerceProductDetailModal: React.FC<EcommerceProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setJustAdded(false);
  }, [product?.id]);

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
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="storefront-detail-dialog"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Encabezado del modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: '#4F55F1',
                backgroundColor: 'rgba(79, 85, 241, 0.08)',
                padding: '3px 10px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
              }}
            >
              {product.brand ?? 'NatsarStore'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div style={{ padding: '0 20px 16px', overflowY: 'auto', flex: 1 }}>
          {/* Banner visual del producto */}
          <div
            className="storefront-modal-image-box"
            style={{
              width: '100%',
              height: '180px',
              borderRadius: '16px',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #E2E8F0',
            }}
          >
            {product.primaryImageUrl ? (
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(79, 85, 241, 0.1)',
                    color: '#4F55F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="package" size={24} />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  Producto DIAN Oficial
                </span>
              </div>
            )}
          </div>

          {/* Título y precio individual */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', margin: '0 0 6px' }}>
            <h2
              style={{
                fontSize: '1.18rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {product.name}
            </h2>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4F55F1', flexShrink: 0 }}>
              {product.formattedPrice}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.84rem',
              color: '#475569',
              lineHeight: 1.45,
              margin: '0 0 14px',
            }}
          >
            {product.description ??
              'Artículo catalogado con trazabilidad de inventario y facturación legal electrónica DIAN.'}
          </p>

          {/* Ficha técnica compacta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              marginBottom: '14px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                Disponibilidad
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: product.inStock ? '#10B981' : '#EF4444',
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
                    backgroundColor: product.inStock ? '#10B981' : '#EF4444',
                  }}
                />
                {product.inStock ? 'En inventario' : 'Agotado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                Régimen Fiscal
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                {product.defaultTaxRate ? `${product.defaultTaxRate}% IVA/INC` : 'Excluido 0%'}
              </span>
            </div>

            {product.sku && (
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                  SKU
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                  {product.sku}
                </span>
              </div>
            )}

            {product.barcodes && product.barcodes.length > 0 && (
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                  Código de Barras
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                  {product.barcodes[0].barcode}
                </span>
              </div>
            )}
          </div>

          {/* Sellos de confianza */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: '#F1F5F9',
              fontSize: '0.74rem',
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="receipt" size={14} style={{ color: '#4F55F1' }} />
              <span>Factura electrónica oficial DIAN con CUFE y QR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="shield" size={14} style={{ color: '#10B981' }} />
              <span>Garantía de servicio y soporte técnico continuo</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acción (Selector + Botón Añadir) */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Selector de cantidad */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F8FAFC',
              borderRadius: '999px',
              padding: '3px 6px',
              border: '1px solid #E2E8F0',
            }}
          >
            <button
              type="button"
              disabled={quantity <= 1 || !product.inStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FFFFFF',
                cursor: quantity <= 1 || !product.inStock ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                color: '#0F172A',
                boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                minWidth: '20px',
                textAlign: 'center',
                color: '#0F172A',
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
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FFFFFF',
                cursor: !product.inStock ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                color: '#0F172A',
                boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          {/* Botón CTA con color Royal Indigo (#4F55F1) */}
          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '999px',
              backgroundColor: justAdded
                ? '#10B981'
                : product.inStock
                ? '#4F55F1'
                : '#E2E8F0',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: product.inStock ? '0 2px 10px rgba(79, 85, 241, 0.28)' : 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            {justAdded ? (
              <>
                <Icon name="check" size={16} />
                <span>¡Añadido!</span>
              </>
            ) : product.inStock ? (
              <>
                <Icon name="shopping-bag" size={15} />
                <span>
                  Añadir {quantity > 1 ? `(${quantity})` : ''} • {formattedTotalPrice}
                </span>
              </>
            ) : (
              <span>Agotado</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .storefront-detail-dialog {
            border-radius: 20px !important;
          }
          .storefront-modal-image-box {
            height: 140px !important;
          }
        }
      `}</style>
    </div>
  );
};
