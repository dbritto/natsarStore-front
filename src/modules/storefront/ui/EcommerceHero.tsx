import React from 'react';
import { Icon } from '@shared/components/atoms/Icon';

export interface EcommerceHeroProps {
  categoryTitle?: string;
  categorySubtitle?: string;
  onFeaturedClick?: () => void;
}

/**
 * Banner Hero E-Commerce (Inspirado fielmente en el encabezado de la imagen de referencia)
 * Muestra el breadcrumb, gran título de categoría ("Body Care"), descripción con filtros,
 * composición visual de envases cosméticos 3D y tarjeta destacada con botón circular naranja.
 */
export const EcommerceHero: React.FC<EcommerceHeroProps> = ({
  categoryTitle = 'Body Care',
  categorySubtitle = 'Creams and balms for daily use, filtered by format, scent, price and stock.',
  onFeaturedClick,
}) => {
  return (
    <section
      style={{
        padding: '36px 36px 30px',
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        margin: '12px 0 24px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #ECEAE4',
        boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Columna Izquierda: Títulos y Descripción */}
        <div style={{ zIndex: 2 }}>
          {/* Breadcrumbs */}
          <div
            style={{
              fontSize: '0.82rem',
              color: '#71717A',
              fontWeight: 500,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Shop</span>
            <span>/</span>
            <span style={{ color: '#18181B', fontWeight: 600 }}>{categoryTitle}</span>
          </div>

          {/* Gran Título Display */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
              fontWeight: 800,
              color: '#18181B',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
              margin: '0 0 14px 0',
            }}
          >
            {categoryTitle}
          </h1>

          {/* Subtítulo / Descripción editorial */}
          <p
            style={{
              fontSize: '0.96rem',
              color: '#52525B',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '520px',
            }}
          >
            {categorySubtitle}
          </p>
        </div>

        {/* Columna Derecha: Tarjeta Flotante Destacada & Composición 3D */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '140px',
          }}
        >
          {/* Tarjeta flotante "Daily Body Cream" estilo imagen de referencia */}
          <div
            onClick={onFeaturedClick}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'transform 0.16s ease, box-shadow 0.16s ease',
              maxWidth: '280px',
              width: '100%',
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
            }}
          >
            {/* Miniatura del producto en tarro */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#F5F3ED',
                border: '1px solid #E5E3DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #D4D4D8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '4px',
                    backgroundColor: '#18181B',
                    borderRadius: '2px',
                    position: 'absolute',
                    top: '-3px',
                    left: '-1px',
                  }}
                />
              </div>
            </div>

            {/* Datos del producto destacado */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#18181B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Daily Body Cream
              </div>
              <div style={{ fontSize: '0.74rem', color: '#71717A', margin: '1px 0 2px' }}>
                Cream, 200 ml
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#18181B' }}>
                $28
              </div>
            </div>

            {/* Botón circular naranja con flecha diagonal */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '999px',
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(249,115,22,0.3)',
              }}
            >
              <Icon name="arrow-up-right" size={14} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
