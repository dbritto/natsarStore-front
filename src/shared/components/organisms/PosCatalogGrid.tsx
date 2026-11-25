import React from 'react';
import { ColorDot } from '../atoms/ColorDot';
import { FormField } from '../molecules/FormField';
import { Icon } from '../atoms/Icon';
import { PosProductCard } from '../molecules/PosProductCard';
import { Button } from '../atoms/Button';

export interface PosCategoryOption {
  id: string;
  name: string;
  colorHex: string;
}

export interface PosProductItemDisplay {
  id: string;
  name: string;
  codeReference: string;
  formattedBasePrice: string;
  taxBadgeLabel: string;
  categoryId: string | null;
  defaultTaxCode: string;
  primaryImageUrl: string | null;
}

export interface PosRecentReceiptPreview {
  id: string;
  invoiceNumber: string;
  customerName: string;
  paymentMethodLabel: string;
  netPayableCop: number;
}

export interface PosCatalogGridProps {
  categories: PosCategoryOption[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchProduct: string;
  onSearchChange: (search: string) => void;
  products: PosProductItemDisplay[];
  onAddToCart: (product: PosProductItemDisplay) => void;
  latestReceipt?: PosRecentReceiptPreview | null;
  onOpenReceiptModal?: (receiptId: string) => void;
}

/**
 * Organismo PosCatalogGrid (Componente Bruto / Presentacional Puro)
 * Columna derecha del TPV: barra de búsqueda, píldoras de categorías y cuadrícula de tarjetas de productos.
 */
export const PosCatalogGrid: React.FC<PosCatalogGridProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  searchProduct,
  onSearchChange,
  products,
  onAddToCart,
  latestReceipt,
  onOpenReceiptModal,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '22px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Buscador */}
        <FormField
          placeholder="Buscar producto por nombre, SKU o escanear código de barras..."
          value={searchProduct}
          onChange={(e) => onSearchChange(e.target.value)}
          leftSlot={<Icon name="search" size={18} />}
        />

        {/* Píldoras de Categorías (Estilo PosyMart) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: activeCategoryId === '' ? '#4D53F4' : '#F1F5F9',
              color: activeCategoryId === '' ? '#FFFFFF' : '#475569',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.16s ease',
            }}
          >
            Todos
          </button>

          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: isActive ? '#4D53F4' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.16s ease',
                }}
              >
                <ColorDot colorHex={cat.colorHex} size={8} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Grilla de Tarjetas de Productos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {products.map((prod) => {
            const isFoodOrDrink = prod.defaultTaxCode === '04' || prod.categoryId === 'cat-cafe-002';
            const isHardware = prod.categoryId === 'cat-hardware-003';

            return (
              <PosProductCard
                key={prod.id}
                id={prod.id}
                name={prod.name}
                formattedPrice={prod.formattedBasePrice}
                taxBadgeLabel={prod.taxBadgeLabel}
                codeReference={prod.codeReference}
                primaryImageUrl={prod.primaryImageUrl}
                isFoodOrDrink={isFoodOrDrink}
                isHardware={isHardware}
                onAddToCart={() => onAddToCart(prod)}
              />
            );
          })}
        </div>
      </div>

      {/* Historial Plegable de Último Comprobante */}
      {latestReceipt && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px 20px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
              Última Factura Emitida: {latestReceipt.invoiceNumber}
            </strong>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {latestReceipt.customerName} • {latestReceipt.paymentMethodLabel}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ fontFamily: 'var(--font-display)', color: '#4D53F4', fontSize: '0.95rem' }}>
              $ {latestReceipt.netPayableCop.toLocaleString('es-CO')}
            </strong>
            {onOpenReceiptModal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Icon name="receipt" size={13} />}
                onClick={() => onOpenReceiptModal(latestReceipt.id)}
              >
                Ver Tirilla QR
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
