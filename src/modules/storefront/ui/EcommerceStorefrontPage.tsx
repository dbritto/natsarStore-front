import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';
import { CatalogUseCases } from '@modules/catalog/application/use-cases/CatalogUseCases';
import { ProductCategoryModel } from '@modules/catalog/domain/models/ProductCategory.model';
import { CatalogItemModel } from '@modules/catalog/domain/models/CatalogItem.model';
import { Icon } from '@shared/components/atoms/Icon';
import { EcommerceHeader } from './EcommerceHeader';
import { EcommerceHero } from './EcommerceHero';
import { CategorySlider, CategoryItem } from './CategorySlider';
import { EcommerceFilters, FilterState } from './EcommerceFilters';
import { EcommerceProductCard, EcommerceProductProps } from './EcommerceProductCard';
import { EcommerceProductDetailModal } from './EcommerceProductDetailModal';
import { EcommerceLoginModal } from './EcommerceLoginModal';

export interface CartItem {
  product: EcommerceProductProps;
  quantity: number;
}

export interface ToastMessage {
  id: string;
  productName: string;
}

export interface EcommerceStorefrontPageProps {
  catalogUseCases: CatalogUseCases;
  session: UserSession | null;
  onOpenFullLogin: () => void;
  onSubmitLogin: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
  onGoToWorkspace: () => void;
  onLogout: () => void;
}

/**
 * Página Principal Tienda E-Commerce Unificada con el Panel Administrativo:
 * - Paleta Corporativa Idéntica: Canvas #F2F4F9, Royal Indigo #4F55F1, Bordes #E2E8F0, Slate #0F172A
 * - 100% Mobile Responsive: Cuadrícula móvil de 2 columnas proporcional, sin botones sobrepuestos ni textos gigantes
 * - Buscador en tiempo real, chips de filtros activos, resumen de compra y acceso al POS
 */
export const EcommerceStorefrontPage: React.FC<EcommerceStorefrontPageProps> = ({
  catalogUseCases,
  session,
  onOpenFullLogin,
  onSubmitLogin,
  onGoToWorkspace,
  onLogout,
}) => {
  // Estado de Datos del Catálogo
  const [categories, setCategories] = useState<ProductCategoryModel[]>([]);
  const [products, setProducts] = useState<CatalogItemModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado de Filtros & Categoría Activa
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [sortOption, setSortOption] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    format: 'all',
    maxPrice: 500000,
    inStockOnly: false,
  });

  // Estado de Modales, Carrito / Bolsa y Toast
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<EcommerceProductProps | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  // Carga inicial del catálogo público (sin JWT)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        catalogUseCases.getCategories(),
        catalogUseCases.getItems(),
      ]);

      if (catsRes.isSuccess) {
        setCategories(catsRes.getValue());
      }
      if (itemsRes.isSuccess) {
        setProducts(itemsRes.getValue());
      }
    } finally {
      setIsLoading(false);
    }
  }, [catalogUseCases]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Manejador para añadir a la bolsa
  const handleAddToCart = (product: EcommerceProductProps, quantityToAdd = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: quantityToAdd }];
    });

    setActiveToast({
      id: `${Date.now()}-${product.id}`,
      productName: product.name,
    });
  };

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const totalCartPrice = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.product.basePrice * curr.quantity, 0);
  }, [cartItems]);

  const categorySliderItems: CategoryItem[] = useMemo(() => {
    return categories.map((cat) => {
      const count = products.filter((p) => p.categoryId === cat.id).length;
      return {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        colorHex: cat.colorHex,
        count,
      };
    });
  }, [categories, products]);

  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  const heroTitle = activeCategory ? activeCategory.name : 'Catálogo Principal';
  const heroSubtitle = activeCategory?.description
    ? activeCategory.description
    : 'Explora nuestros productos de alta calidad y servicios listos para facturación electrónica DIAN.';

  // Filtrado y ordenamiento
  const filteredProducts: EcommerceProductProps[] = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return products
      .filter((p) => {
        if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
          return false;
        }

        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = (p.raw.description ?? '').toLowerCase().includes(q);
          const matchRef = p.codeReference.toLowerCase().includes(q);
          const matchBrand = (p.raw.brand ?? '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchRef && !matchBrand) return false;
        }

        if (filters.format !== 'all') {
          const textToInspect = `${p.name} ${p.raw.description ?? ''} ${p.raw.itemType}`.toLowerCase();
          if (filters.format === 'cream' && !textToInspect.includes('cream') && !textToInspect.includes('crema')) {
            return false;
          }
          if (filters.format === 'balm' && !textToInspect.includes('balm') && !textToInspect.includes('bálsamo')) {
            return false;
          }
          if (filters.format === 'service' && p.raw.itemType !== 'SERVICE' && !textToInspect.includes('servicio')) {
            return false;
          }
        }

        if (p.basePrice > filters.maxPrice) {
          return false;
        }

        const inStock = p.raw.trackInventory !== false;
        if (filters.inStockOnly && !inStock) {
          return false;
        }

        return true;
      })
      .map((p) => {
        const inStock = p.raw.trackInventory !== false;
        const formattedPrice =
          p.basePrice < 1000
            ? `$${p.basePrice}`
            : `$${p.basePrice.toLocaleString('es-CO')}`;

        return {
          id: p.id,
          name: p.name,
          codeReference: p.codeReference,
          sku: p.raw.sku,
          description: p.raw.description,
          basePrice: p.basePrice,
          formattedPrice,
          categoryId: p.categoryId,
          brand: p.raw.brand,
          primaryImageUrl: p.raw.primaryImage?.url ?? null,
          inStock,
          defaultTaxRate: p.raw.defaultTaxRate,
          barcodes: p.raw.barcodes,
        };
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return a.basePrice - b.basePrice;
        if (sortOption === 'price-desc') return b.basePrice - a.basePrice;
        if (sortOption === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, selectedCategoryId, filters, sortOption]);

  const isFilterActive =
    Boolean(filters.search) ||
    Boolean(selectedCategoryId) ||
    filters.format !== 'all' ||
    filters.maxPrice < 500000 ||
    filters.inStockOnly;

  const handleClearFilters = () => {
    setFilters({
      search: '',
      format: 'all',
      maxPrice: 500000,
      inStockOnly: false,
    });
    setSelectedCategoryId('');
  };

  return (
    <div
      style={{
        backgroundColor: '#F2F4F9',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header con Buscador Inteligente, Marca NatsarStore y Login Superior */}
      <EcommerceHeader
        session={session}
        cartCount={totalCartCount}
        searchValue={filters.search}
        onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val }))}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onGoToWorkspace={onGoToWorkspace}
        onLogout={onLogout}
        onLogoClick={handleClearFilters}
        onCartClick={() => setIsCartDrawerOpen(true)}
      />

      <main className="storefront-main-layout">
        {/* 2. Banner Hero Display */}
        <EcommerceHero
          categoryTitle={heroTitle}
          categorySubtitle={heroSubtitle}
          onFeaturedClick={() => {
            const firstProduct = filteredProducts[0];
            if (firstProduct) setSelectedProductDetail(firstProduct);
          }}
        />

        {/* 3. Slider de Categorías interactivo */}
        <div style={{ padding: '0 0 6px 0', width: '100%' }}>
          <CategorySlider
            categories={categorySliderItems}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            totalProductsCount={products.length}
          />
        </div>

        {/* 4. Barra Superior de Control de Cuadrícula (Móvil & Desktop) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '16px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{filteredProducts.length} productos</span>
              {isLoading && (
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 400 }}>
                  (cargando...)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Botón para abrir filtros en móvil (sin sobreposiciones) */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                aria-label="Abrir panel de filtros"
                className="storefront-filter-trigger-btn"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: isFilterActive ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: isFilterActive ? '#4F55F1' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                }}
              >
                <Icon name="filter" size={13} />
                <span>Filtros {isFilterActive && '•'}</span>
              </button>

              {/* Selector de Ordenamiento */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="storefront-sort-label" style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Ordenar:
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  aria-label="Ordenar productos"
                  style={{
                    padding: '6px 26px 6px 10px',
                    borderRadius: '999px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                  }}
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chips de Filtros Activos con colores unificados */}
          {isFilterActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '6px 10px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginRight: '2px' }}>
                Filtros:
              </span>

              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>{activeCategory?.name ?? 'Categoría'}</span>
                  <Icon name="x" size={11} />
                </button>
              )}

              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>"{filters.search}"</span>
                  <Icon name="x" size={11} />
                </button>
              )}

              {filters.format !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, format: 'all' }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>{filters.format}</span>
                  <Icon name="x" size={11} />
                </button>
              )}

              {filters.maxPrice < 500000 && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, maxPrice: 500000 }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>≤ ${filters.maxPrice.toLocaleString('es-CO')}</span>
                  <Icon name="x" size={11} />
                </button>
              )}

              {filters.inStockOnly && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, inStockOnly: false }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>En stock</span>
                  <Icon name="x" size={11} />
                </button>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F55F1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* 5. Estructura Principal: Sidebar Filtros (Desktop) + Grilla de Productos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            width: '100%',
          }}
        >
          {/* Panel Lateral de Filtros (Desktop) */}
          <div className="storefront-desktop-filters" style={{ width: '260px', flexShrink: 0 }}>
            <EcommerceFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              isFilterActive={isFilterActive}
              totalResultsCount={filteredProducts.length}
            />
          </div>

          {/* Grilla Responsiva de Productos (2 columnas en móvil, 3-4 en desktop) */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {isLoading ? (
              <div className="storefront-product-grid">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div
                    key={k}
                    style={{
                      height: '240px',
                      borderRadius: '18px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                  }}
                >
                  <Icon name="search" size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  No hay productos con los filtros aplicados
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, maxWidth: '380px', lineHeight: 1.4 }}>
                  Intenta ajustar el término de búsqueda o restablecer los filtros para ver todo el catálogo disponible.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    marginTop: '4px',
                    padding: '8px 20px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 85, 241, 0.25)',
                  }}
                >
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="storefront-product-grid">
                {filteredProducts.map((prod) => (
                  <EcommerceProductCard
                    key={prod.id}
                    {...prod}
                    onAddToCart={() => handleAddToCart(prod)}
                    onOpenDetail={() => setSelectedProductDetail(prod)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6. Barra de Confianza y Propuesta de Valor */}
        <section
          style={{
            marginTop: '48px',
            padding: '28px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(79, 85, 241, 0.08)',
                color: '#4F55F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="sparkles" size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                Software 100% en la Nube
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Acceso inmediato desde cualquier dispositivo sin instalaciones físicas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                color: '#F97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="receipt" size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                Facturación DIAN oficial
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Emisión electrónica con validación previa DIAN, CUFE y código QR.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="shield" size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                Garantía y Calidad 100%
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Productos originales con trazabilidad de inventario en tiempo real.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(79, 85, 241, 0.08)',
                color: '#4F55F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="store" size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                Conexión con Terminal POS
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Sincronización instantánea de stock físico con NatsarStore POS.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer Corporativo Unificado */}
      <footer
        style={{
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          padding: '24px 20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid #F1F5F9',
            paddingBottom: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4F55F1' }}>NatsarStore</span>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>• Facturación Electrónica & Catálogo Comercial</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#475569' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCategoryId('')}>Catálogo</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }} onClick={onOpenFullLogin}>Acceso al Panel</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setIsCartDrawerOpen(true)}>Bolsa ({totalCartCount})</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94A3B8' }}>
          <span>© {new Date().getFullYear()} NatsarStore. Cumplimiento DIAN Anexo 1.9.</span>
          <span>Sincronizado con el Sistema POS</span>
        </div>
      </footer>

      {/* 8. Toast de Notificación Flotante */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '999px',
            padding: '8px 16px 8px 12px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 150,
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={13} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {activeToast.productName}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveToast(null);
              setIsCartDrawerOpen(true);
            }}
            style={{
              backgroundColor: '#4F55F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '2px',
            }}
          >
            Ver bolsa →
          </button>
        </div>
      )}

      {/* 9. Modal de Inicio de Sesión */}
      <EcommerceLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmitLogin={onSubmitLogin}
        onNavigateToFullLoginPage={onOpenFullLogin}
      />

      {/* 10. Modal de Detalle del Producto */}
      <EcommerceProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 11. Modal Drawer de Filtros para Móvil */}
      {isMobileFiltersOpen && (
        <div
          onClick={() => setIsMobileFiltersOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(300px, 85vw)',
              height: '100%',
              backgroundColor: '#FFFFFF',
              padding: '20px 16px',
              overflowY: 'auto',
              boxShadow: '10px 0 30px rgba(15, 23, 42, 0.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="x" size={15} />
              </button>
            </div>
            <EcommerceFilters
              filters={filters}
              onFilterChange={(f) => setFilters(f)}
              onClearFilters={handleClearFilters}
              isFilterActive={isFilterActive}
              totalResultsCount={filteredProducts.length}
            />
          </div>
        </div>
      )}

      {/* 12. Drawer Lateral de Bolsa / Bag */}
      {isCartDrawerOpen && (
        <div
          onClick={() => setIsCartDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(380px, 100vw)',
              height: '100%',
              backgroundColor: '#FFFFFF',
              padding: '24px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.15)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="shopping-bag" size={18} style={{ color: '#4F55F1' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Tu Bolsa ({totalCartCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                aria-label="Cerrar bolsa"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="x" size={15} />
              </button>
            </div>

            {/* Resumen de Artículos en la Bolsa */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                Total de artículos agregados:
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F55F1' }}>
                {totalCartCount} {totalCartCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Lista de productos en bolsa */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <Icon name="shopping-bag" size={36} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>
                    Tu bolsa está vacía
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 14px' }}>
                    Agrega productos explorando el catálogo
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(false)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '999px',
                      backgroundColor: '#4F55F1',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ver catálogo
                  </button>
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
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
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F55F1', marginTop: '1px' }}>
                        {product.formattedPrice}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '999px',
                          padding: '2px 5px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(product.id, -1)}
                          style={{
                            width: '20px',
                            height: '20px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: 800,
                            color: '#64748B',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(product.id, 1)}
                          style={{
                            width: '20px',
                            height: '20px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: 800,
                            color: '#64748B',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(product.id)}
                        title="Eliminar de la bolsa"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                        }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total y checkout con Royal Indigo */}
            {cartItems.length > 0 && (
              <div style={{ paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                    Total estimado
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                    ${totalCartPrice.toLocaleString('es-CO')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!session) {
                      setIsCartDrawerOpen(false);
                      setIsLoginModalOpen(true);
                    } else {
                      setIsCartDrawerOpen(false);
                      onGoToWorkspace();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '999px',
                    backgroundColor: '#4F55F1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 85, 241, 0.3)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3F44D9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4F55F1';
                  }}
                >
                  {session ? 'Procesar en Terminal POS' : 'Iniciar sesión para comprar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reglas CSS Responsivas: 2 Columnas en móvil, proporciones equilibradas */}
      <style>{`
        .storefront-main-layout {
          width: 100%;
          padding: 0 24px 48px;
          flex: 1;
          box-sizing: border-box;
        }
        .storefront-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          width: 100%;
        }
        @media (max-width: 900px) {
          .storefront-desktop-filters {
            display: none !important;
          }
          .storefront-filter-trigger-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .storefront-main-layout {
            padding: 0 12px 32px !important;
          }
          .storefront-product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .storefront-sort-label {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
