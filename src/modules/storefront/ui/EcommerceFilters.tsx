import React from 'react';
import { Icon } from '@shared/components/atoms/Icon';

export interface FilterState {
  search: string;
  format: string; // 'all' | 'cream' | 'balm' | 'service'
  maxPrice: number;
  inStockOnly: boolean;
}

export interface EcommerceFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearFilters: () => void;
  isFilterActive: boolean;
  totalResultsCount: number;
}

/**
 * Panel Lateral de Filtros E-Commerce (Inspirado en la barra lateral 'Filters' de la imagen)
 * Permite filtrar por texto de búsqueda, formato/tipo de producto, rango de precio y disponibilidad en stock.
 */
export const EcommerceFilters: React.FC<EcommerceFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  isFilterActive,
}) => {
  const update = (patch: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...patch });
  };

  return (
    <aside
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        padding: '24px 20px',
        border: '1px solid #ECEAE4',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '280px',
        flexShrink: 0,
      }}
    >
      {/* Encabezado: Título 'Filters' y botón 'Limpiar' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181B', margin: 0 }}>
          Filters
        </h2>
        {isFilterActive && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#F97316',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Buscador de productos */}
      <div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '12px',
              color: '#A1A1AA',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="search" size={15} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '999px',
              border: '1px solid #E4E4E7',
              backgroundColor: '#FBFBFA',
              fontSize: '0.84rem',
              color: '#18181B',
              outline: 'none',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#18181B';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E4E4E7';
              e.currentTarget.style.backgroundColor = '#FBFBFA';
            }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#A1A1AA',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtro: Formato (Cream, Balm, Todos) estilo píldoras de la imagen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717A' }}>
          Format
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'cream', label: 'Cream' },
            { id: 'balm', label: 'Balm' },
            { id: 'service', label: 'Servicios' },
          ].map((f) => {
            const isSelected = filters.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => update({ format: f.id })}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid #18181B' : '1px solid #E4E1DB',
                  backgroundColor: isSelected ? '#18181B' : '#F5F3ED',
                  color: isSelected ? '#FFFFFF' : '#3F3F46',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro: Precio con Slider Interactivo y Píldoras rápidas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717A' }}>
            Price (Hasta)
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#18181B' }}>
            ${filters.maxPrice.toLocaleString('es-CO')}
          </span>
        </div>

        {/* Input tipo rango deslizante */}
        <input
          type="range"
          min="10000"
          max="500000"
          step="5000"
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          style={{
            width: '100%',
            accentColor: '#18181B',
            cursor: 'pointer',
          }}
        />

        {/* Rangos rápidos de precio inspirados en la imagen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Menos de $25.000', value: 25000 },
            { label: '$25.000 a $40.000', value: 40000 },
            { label: '$40.000 a $100.000', value: 100000 },
            { label: 'Todos los precios ($500.000)', value: 500000 },
          ].map((tier) => {
            const isMatch = filters.maxPrice === tier.value;
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => update({ maxPrice: tier.value })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isMatch ? '#F4F2EC' : 'transparent',
                  color: isMatch ? '#18181B' : '#52525B',
                  fontWeight: isMatch ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isMatch) e.currentTarget.style.backgroundColor = '#FAF9F6';
                }}
                onMouseLeave={(e) => {
                  if (!isMatch) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{tier.label}</span>
                {isMatch && <span style={{ color: '#16A34A', fontSize: '0.8rem' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro: Disponibilidad / Switch 'In stock' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid #ECEAE4',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717A' }}>
            Availability
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#18181B' }}>
            In stock
          </div>
        </div>

        {/* Switch Toggle nativo estilizado */}
        <button
          type="button"
          onClick={() => update({ inStockOnly: !filters.inStockOnly })}
          role="switch"
          aria-checked={filters.inStockOnly}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '999px',
            backgroundColor: filters.inStockOnly ? '#18181B' : '#E4E4E7',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background-color 0.2s ease',
            padding: '2px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              position: 'absolute',
              top: '2px',
              left: filters.inStockOnly ? '22px' : '2px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
    </aside>
  );
};
