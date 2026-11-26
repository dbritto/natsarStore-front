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
 * Panel Lateral de Filtros E-Commerce Unificado con el Panel Administrativo:
 * - Colores coherentes: Royal Indigo (#4F55F1), superficies #FFFFFF / #F8FAFC, bordes #E2E8F0
 * - Permite filtrar por búsqueda de texto, formato, precio máximo y disponibilidad en inventario
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
        borderRadius: '20px',
        padding: '20px 18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Encabezado: Título 'Filtros' y botón 'Limpiar' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Filtros
        </h2>
        {isFilterActive && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#4F55F1',
              fontSize: '0.76rem',
              fontWeight: 700,
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
              color: '#94A3B8',
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
              padding: '8px 12px 8px 36px',
              borderRadius: '999px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              fontSize: '0.82rem',
              color: '#0F172A',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4F55F1';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.backgroundColor = '#F8FAFC';
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
                color: '#94A3B8',
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

      {/* Filtro: Formato (Cream, Balm, Servicios, Todos) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
          Formato / Tipo
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'cream', label: 'Crema' },
            { id: 'balm', label: 'Bálsamo' },
            { id: 'service', label: 'Servicios' },
          ].map((f) => {
            const isSelected = filters.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => update({ format: f.id })}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#4F55F1' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.14s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro: Precio con Slider y Rangos rápidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
            Precio Máximo
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#4F55F1' }}>
            ${filters.maxPrice.toLocaleString('es-CO')}
          </span>
        </div>

        {/* Input tipo rango deslizante con acento Royal Indigo */}
        <input
          type="range"
          min="10000"
          max="500000"
          step="5000"
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          style={{
            width: '100%',
            accentColor: '#4F55F1',
            cursor: 'pointer',
          }}
        />

        {/* Rangos rápidos de precio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { label: 'Hasta $25.000', value: 25000 },
            { label: 'Hasta $40.000', value: 40000 },
            { label: 'Hasta $100.000', value: 100000 },
            { label: 'Todos los precios', value: 500000 },
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
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isMatch ? 'rgba(79, 85, 241, 0.08)' : 'transparent',
                  color: isMatch ? '#4F55F1' : '#475569',
                  fontWeight: isMatch ? 700 : 500,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{tier.label}</span>
                {isMatch && <span style={{ color: '#4F55F1', fontWeight: 800 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro: Disponibilidad / Switch 'En stock' */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        <div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>
            Disponibilidad
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
            Solo en stock
          </div>
        </div>

        {/* Switch Toggle estilizado con acento Royal Indigo */}
        <button
          type="button"
          onClick={() => update({ inStockOnly: !filters.inStockOnly })}
          role="switch"
          aria-checked={filters.inStockOnly}
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            backgroundColor: filters.inStockOnly ? '#4F55F1' : '#E2E8F0',
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
              left: filters.inStockOnly ? '20px' : '2px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
    </aside>
  );
};
