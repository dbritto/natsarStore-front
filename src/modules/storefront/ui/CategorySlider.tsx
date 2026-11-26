import React, { useEffect, useRef, useState } from 'react';
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
 * Componente Slider de Categorías de Alta Intuición (Organismo E-Commerce)
 * Con desplazamiento táctil/drag suave, máscaras de desvanecimiento en bordes,
 * flechas inteligentes con desactivación automática en extremos y conteos de productos.
 */
export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalProductsCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Estados para arrastrar con mouse (drag to scroll)
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const hasMoved = useRef(false);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftPos.current = el.scrollLeft;
    hasMoved.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMoved.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftPos.current - walk;
    checkScrollability();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleCategoryClick = (id: string) => {
    // Si el usuario estaba arrastrando para desplazarse, no disparar selección accidental
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    onSelectCategory(id);
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
        disabled={!canScrollLeft}
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
          color: canScrollLeft ? '#18181B' : '#D4D4D8',
          cursor: canScrollLeft ? 'pointer' : 'default',
          flexShrink: 0,
          boxShadow: canScrollLeft ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
          opacity: canScrollLeft ? 1 : 0.45,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (canScrollLeft) {
            e.currentTarget.style.backgroundColor = '#18181B';
            e.currentTarget.style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={(e) => {
          if (canScrollLeft) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.color = '#18181B';
          }
        }}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      {/* Contenedor deslizante de píldoras con soporte drag & scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto',
          scrollBehavior: isDragging.current ? 'auto' : 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 2px',
          flex: 1,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Píldora "Todos" */}
        <button
          type="button"
          onClick={() => handleCategoryClick('')}
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
            flexShrink: 0,
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
              onClick={() => handleCategoryClick(cat.id)}
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
                flexShrink: 0,
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
        disabled={!canScrollRight}
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
          color: canScrollRight ? '#18181B' : '#D4D4D8',
          cursor: canScrollRight ? 'pointer' : 'default',
          flexShrink: 0,
          boxShadow: canScrollRight ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
          opacity: canScrollRight ? 1 : 0.45,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (canScrollRight) {
            e.currentTarget.style.backgroundColor = '#18181B';
            e.currentTarget.style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={(e) => {
          if (canScrollRight) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.color = '#18181B';
          }
        }}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </div>
  );
};
