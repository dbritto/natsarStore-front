import React from 'react';
import { Icon } from '@shared/components/atoms/Icon';

export interface EcommerceHeroProps {
  categoryTitle?: string;
  categorySubtitle?: string;
  onFeaturedClick?: () => void;
}

/**
 * Banner Hero E-Commerce Unificado con la identidad del Panel Administrativo:
 * - Colores coherentes: Fondo blanco puro (#FFFFFF), bordes sutiles (#E2E8F0) y acentos Royal Indigo (#4F55F1)
 * - 100% Mobile Responsive: Tipografía equilibrada y tarjeta destacada que no se sobrepone
 */
export const EcommerceHero: React.FC<EcommerceHeroProps> = ({
  categoryTitle = 'Catálogo General',
  categorySubtitle = 'Explora nuestros productos y servicios certificados con facturación electrónica DIAN inmediata.',
  onFeaturedClick,
}) => {
  return (
    <section
      className="storefront-hero-container"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        margin: '12px 0 18px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="storefront-hero-grid"
        style={{
          display: 'grid',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Columna Izquierda: Breadcrumbs, Título y Descripción */}
        <div style={{ zIndex: 2 }}>
          {/* Breadcrumbs */}
          <div
            style={{
              fontSize: '0.78rem',
              color: '#64748B',
              fontWeight: 500,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Tienda</span>
            <span>/</span>
            <span style={{ color: '#4F55F1', fontWeight: 600 }}>{categoryTitle}</span>
          </div>

          {/* Gran Título Display Proporcional */}
          <h1
            style={{
              fontSize: 'clamp(1.4rem, 4.2vw, 2.3rem)',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.8px',
              lineHeight: 1.15,
              margin: '0 0 10px 0',
            }}
          >
            {categoryTitle}
          </h1>

          {/* Subtítulo / Descripción editorial */}
          <p
            style={{
              fontSize: '0.86rem',
              color: '#475569',
              lineHeight: 1.45,
              margin: 0,
              maxWidth: '520px',
            }}
          >
            {categorySubtitle}
          </p>
        </div>

        {/* Columna Derecha: Tarjeta Destacada Compacta */}
        <div
          className="storefront-hero-featured-col"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={onFeaturedClick}
            title="Ver producto destacado"
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'transform 0.16s ease, box-shadow 0.16s ease',
              width: '100%',
              maxWidth: '290px',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.09)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.06)';
            }}
          >
            {/* Icono de producto destacado */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 85, 241, 0.1)',
                color: '#4F55F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="sparkles" size={20} />
            </div>

            {/* Datos del producto destacado */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Destacado del Catálogo
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', margin: '1px 0' }}>
                Stock disponible en sede
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#4F55F1' }}>
                Ver producto →
              </div>
            </div>

            {/* Botón circular naranja con flecha diagonal */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(249,115,22,0.3)',
              }}
            >
              <Icon name="arrow-up-right" size={13} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .storefront-hero-container {
          padding: 24px 28px;
        }
        .storefront-hero-grid {
          grid-template-columns: 1fr auto;
        }
        @media (max-width: 768px) {
          .storefront-hero-container {
            padding: 16px 14px !important;
            border-radius: 18px !important;
            margin: 8px 0 14px !important;
          }
          .storefront-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .storefront-hero-featured-col {
            justifyContent: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
};
