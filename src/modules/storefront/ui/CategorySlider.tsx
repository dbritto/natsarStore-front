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
 * Componente Slider de Categorías con Colores del Panel Administrativo:
 * - Activo: Royal Indigo (#4F55F1)
 * - Inactivo: Superficie limpia (#FFFFFF / #F1F5F9) con borde #E2E8F0
 * - 100% Mobile Responsive: En móviles optimiza el espacio horizontal permitiendo deslizamiento táctil fluido
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

  // Estados para arrastrar con mouse (drag to scroll en desktop)
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
      const scrollAmount = direction === 'left' ? -240 : 240;
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
        gap: '6px',
        width: '100%',
        position: 'relative',
        margin: '6px 0 16px',
      }}
    >
      {/* Botón flecha izquierda (se oculta en móviles pequeños para ganar espacio) */}
      <button
        type="button"
        className="category-slider-arrow"
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Desplazar categorías hacia la izquierda"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: canScrollLeft ? '#0F172A' : '#CBD5E1',
          cursor: canScrollLeft ? 'pointer' : 'default',
          flexShrink: 0,
          boxShadow: canScrollLeft ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
          opacity: canScrollLeft ? 1 : 0.4,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon name="chevron-left" size={15} />
      </button>

      {/* Contenedor deslizante de píldoras con soporte drag & touch */}
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
          gap: '8px',
          overflowX: 'auto',
          scrollBehavior: isDragging.current ? 'auto' : 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '2px 0',
          flex: 1,
          WebkitOverflowScrolling: 'touch',
          userSelect: 'none',
        }}
      >
        {/* Píldora "Todos los productos" */}
        <button
          type="button"
          onClick={() => handleCategoryClick('')}
          style={{
            padding: '7px 14px',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: selectedCategoryId === '' ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: selectedCategoryId === '' ? '#4F55F1' : '#FFFFFF',
            color: selectedCategoryId === '' ? '#FFFFFF' : '#334155',
            boxShadow:
              selectedCategoryId === '' ? '0 2px 8px rgba(79, 85, 241, 0.28)' : '0 1px 2px rgba(15,23,42,0.02)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
        >
          <span>Todos los productos</span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: selectedCategoryId === '' ? 'rgba(255,255,255,0.22)' : '#F1F5F9',
              color: selectedCategoryId === '' ? '#FFFFFF' : '#64748B',
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
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: isSelected ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isSelected ? '#4F55F1' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#334155',
                boxShadow:
                  isSelected ? '0 2px 8px rgba(79, 85, 241, 0.28)' : '0 1px 2px rgba(15,23,42,0.02)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <span>{cat.name}</span>
              {typeof cat.count === 'number' && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                  }}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Botón flecha derecha (se oculta en móviles pequeños para ganar espacio) */}
      <button
        type="button"
        className="category-slider-arrow"
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Desplazar categorías hacia la derecha"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: canScrollRight ? '#0F172A' : '#CBD5E1',
          cursor: canScrollRight ? 'pointer' : 'default',
          flexShrink: 0,
          boxShadow: canScrollRight ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
          opacity: canScrollRight ? 1 : 0.4,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon name="chevron-right" size={15} />
      </button>

      <style>{`
        @media (max-width: 640px) {
          .category-slider-arrow {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
