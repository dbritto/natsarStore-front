import React, { useRef } from 'react';
import { Icon } from '@shared/components/atoms/Icon';

export interface CategoryItem {
  id: string;
  name: string;
  code?: string;
  colorHex?: string;
  count?: number;
}

export interface CategorySliderProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  totalProductsCount: number;
}

/**
 * Componente Slider de Categorías (Organismo E-Commerce)
 * Permite navegar horizontalmente por las categorías con botones de desplazamiento suave (‹ ›)
 * y seleccionar categorías para filtrar los productos en tiempo real.
 */
export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalProductsCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        position: 'relative',
        margin: '12px 0 20px',
      }}
    >
      {/* Botón flecha izquierda */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Desplazar categorías hacia la izquierda"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '999px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#18181B',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#18181B';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.color = '#18181B';
        }}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      {/* Contenedor deslizante de píldoras */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 2px',
          flex: 1,
        }}
      >
        {/* Píldora "Todos" */}
        <button
          type="button"
          onClick={() => onSelectCategory('')}
          style={{
            padding: '9px 18px',
            borderRadius: '999px',
            fontSize: '0.86rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: selectedCategoryId === '' ? '#18181B' : '#EFECE6',
            color: selectedCategoryId === '' ? '#FFFFFF' : '#3F3F46',
            boxShadow:
              selectedCategoryId === '' ? '0 4px 12px rgba(24,24,27,0.18)' : 'none',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedCategoryId !== '') {
              e.currentTarget.style.backgroundColor = '#E5E2DC';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategoryId !== '') {
              e.currentTarget.style.backgroundColor = '#EFECE6';
            }
          }}
        >
          <span>Todos los productos</span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: selectedCategoryId === '' ? 'rgba(255,255,255,0.2)' : '#DDD9D2',
              color: selectedCategoryId === '' ? '#FFFFFF' : '#52525B',
            }}
          >
            {totalProductsCount}
          </span>
        </button>

        {/* Píldoras de cada categoría */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '999px',
                fontSize: '0.86rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isSelected ? '#18181B' : '#EFECE6',
                color: isSelected ? '#FFFFFF' : '#3F3F46',
                boxShadow: isSelected ? '0 4px 12px rgba(24,24,27,0.18)' : 'none',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#E5E2DC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#EFECE6';
                }
              }}
            >
              <span>{cat.name}</span>
              {typeof cat.count === 'number' && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#DDD9D2',
                    color: isSelected ? '#FFFFFF' : '#52525B',
                  }}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Botón flecha derecha */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Desplazar categorías hacia la derecha"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '999px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#18181B',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#18181B';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.color = '#18181B';
        }}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </div>
  );
};
