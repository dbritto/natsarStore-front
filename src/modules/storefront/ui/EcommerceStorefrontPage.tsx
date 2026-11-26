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

export interface EcommerceStorefrontPageProps {
  catalogUseCases: CatalogUseCases;
  session: UserSession | null;
  onOpenFullLogin: () => void;
  onSubmitLogin: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
  onGoToWorkspace: () => void;
  onLogout: () => void;
}

/**
 * Página Principal Tienda E-Commerce (Front Storefront)
 * Inspirada en el diseño visual de referencia (Hollis / Claymorphism escandinavo limpio).
 * Carga productos de la tienda inmediatamente, incluye slider horizontal para filtrar por categoría,
 * panel lateral de filtros, cuadrícula responsiva y botón de login en la parte superior derecha.
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

  // Estado de Modales y Carrito / Bolsa
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<EcommerceProductProps | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // 1. Cargar categorías y productos apenas entren a la aplicación (públicamente sin requerir JWT)
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
  const handleAddToCart = (product: EcommerceProductProps) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

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

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const totalCartPrice = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.product.basePrice * curr.quantity, 0);
  }, [cartItems]);

  // Preparar opciones de categorías con conteo para el Slider
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

  // Obtener información de la categoría activa para el Hero
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  const heroTitle = activeCategory ? activeCategory.name : 'Body Care';
  const heroSubtitle = activeCategory?.description
    ? activeCategory.description
    : 'Creams and balms for daily use, filtered by format, scent, price and stock.';

  // Filtrado y ordenamiento de productos
  const filteredProducts: EcommerceProductProps[] = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return products
      .filter((p) => {
        // Filtro por categoría seleccionada en slider o navbar
        if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
          return false;
        }

        // Filtro por búsqueda de texto
        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = (p.raw.description ?? '').toLowerCase().includes(q);
          const matchRef = p.codeReference.toLowerCase().includes(q);
          const matchBrand = (p.raw.brand ?? '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchRef && !matchBrand) return false;
        }

        // Filtro por formato
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

        // Filtro por precio máximo
        if (p.basePrice > filters.maxPrice) {
          return false;
        }

        // Filtro por disponibilidad en stock
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
        return 0; // 'featured' por defecto
      });
  }, [products, selectedCategoryId, filters, sortOption]);

  const isFilterActive =
    Boolean(filters.search) ||
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
        backgroundColor: '#F5F4F0',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#18181B',
      }}
    >
      {/* 1. Header con Buscador, Logotipo y Botón de Login en la parte superior derecha */}
      <EcommerceHeader
        session={session}
        cartCount={totalCartCount}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onGoToWorkspace={onGoToWorkspace}
        onLogout={onLogout}
        onSearchClick={() => {
          const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement | null;
          searchInput?.focus();
        }}
        onLogoClick={handleClearFilters}
        onCartClick={() => setIsCartDrawerOpen(true)}
      />

      <main style={{ width: '100%', padding: '0 32px 60px' }}>
        {/* 2. Banner Hero Display inspirado en Hollis Body Care */}
        <EcommerceHero
          categoryTitle={heroTitle}
          categorySubtitle={heroSubtitle}
          onFeaturedClick={() => {
            const firstProduct = filteredProducts[0];
            if (firstProduct) setSelectedProductDetail(firstProduct);
          }}
        />

        {/* 3. Slider de Categorías interactivo con botones ‹ › */}
        <div style={{ padding: '0 0 10px 0', width: '100%' }}>
          <CategorySlider
            categories={categorySliderItems}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            totalProductsCount={products.length}
          />
        </div>

        {/* 4. Barra de Acciones Móvil (Botón para abrir Filtros en pantallas pequeñas) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 16px 0',
            width: '100%',
          }}
          className="storefront-mobile-filter-bar"
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#18181B' }}>
            <span>{filteredProducts.length} products</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Botón flotante para abrir filtros en móvil */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: '1px solid #E5E5E5',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              className="storefront-filter-trigger-btn"
            >
              <Icon name="filter" size={14} />
              <span>Filtros {isFilterActive && '•'}</span>
            </button>

            {/* Selector de Ordenamiento estilo 'Sort by: Featured v' */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 500 }}>
                Sort by
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                style={{
                  padding: '6px 28px 6px 12px',
                  borderRadius: '999px',
                  border: '1px solid #E4E1DB',
                  backgroundColor: '#FFFFFF',
                  color: '#18181B',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '14px',
                }}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Estructura Principal: Sidebar de Filtros (Izquierda) + Grilla de Productos (Derecha) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '28px',
            width: '100%',
          }}
        >
          {/* Panel Lateral de Filtros (Desktop) */}
          <div className="storefront-desktop-filters" style={{ width: '280px', flexShrink: 0 }}>
            <EcommerceFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              isFilterActive={isFilterActive}
              totalResultsCount={filteredProducts.length}
            />
          </div>

          {/* Grilla Responsiva de Productos */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {isLoading ? (
              /* Skeleton Loader suave */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '16px',
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div
                    key={k}
                    style={{
                      height: '300px',
                      borderRadius: '24px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #ECEAE4',
                      opacity: 0.6,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Estado sin resultados */
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '28px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #ECEAE4',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F3ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A1A1AA',
                  }}
                >
                  <Icon name="search" size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181B', margin: 0 }}>
                  No se encontraron productos
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#71717A', margin: 0, maxWidth: '360px' }}>
                  No hay productos que coincidan con los filtros aplicados. Intenta ampliar el rango de precio o limpiar la búsqueda.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    marginTop: '8px',
                    padding: '8px 20px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Ver todos los productos
                </button>
              </div>
            ) : (
              /* Cuadrícula de productos de alta fidelidad estilo Hollis ocupando todo el ancho */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '20px',
                  width: '100%',
                }}
              >
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
      </main>

      {/* 6. Modal de Inicio de Sesión (abierto desde el botón superior derecho) */}
      <EcommerceLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmitLogin={onSubmitLogin}
        onNavigateToFullLoginPage={onOpenFullLogin}
      />

      {/* 7. Modal de Ficha Técnica / Detalle del Producto */}
      <EcommerceProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 8. Modal Drawer de Filtros para Móvil */}
      {isMobileFiltersOpen && (
        <div
          onClick={() => setIsMobileFiltersOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '85%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              padding: '24px',
              overflowY: 'auto',
              boxShadow: '10px 0 30px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F4F4F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <EcommerceFilters
              filters={filters}
              onFilterChange={(f) => {
                setFilters(f);
              }}
              onClearFilters={handleClearFilters}
              isFilterActive={isFilterActive}
              totalResultsCount={filteredProducts.length}
            />
          </div>
        </div>
      )}

      {/* 9. Drawer Lateral de Bolsa / Bag */}
      {isCartDrawerOpen && (
        <div
          onClick={() => setIsCartDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '14px',
                borderBottom: '1px solid #ECEAE4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="shopping-bag" size={20} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#18181B' }}>
                  Tu Bolsa ({totalCartCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F4F4F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Lista de productos en bolsa */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#71717A' }}>
                  <Icon name="shopping-bag" size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.88rem', margin: 0 }}>Tu bolsa está vacía</p>
                  <span style={{ fontSize: '0.78rem', color: '#A1A1AA' }}>
                    Agrega productos pulsando en el botón '+' de cada artículo
                  </span>
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '16px',
                      backgroundColor: '#FAFAF9',
                      border: '1px solid #ECEAE4',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: '#18181B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#52525B' }}>
                        {product.formattedPrice}
                      </div>
                    </div>

                    {/* Controles de cantidad (+ / -) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '999px',
                        padding: '2px 6px',
                        border: '1px solid #E4E1DB',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(product.id, -1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          color: '#71717A',
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(product.id, 1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          color: '#71717A',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total y checkout */}
            {cartItems.length > 0 && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid #ECEAE4' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#71717A', fontWeight: 600 }}>
                    Total estimado
                  </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#18181B' }}>
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
                    padding: '13px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(24,24,27,0.2)',
                  }}
                >
                  {session ? 'Procesar en Terminal POS' : 'Iniciar sesión para comprar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estilos CSS responsivos integrados */}
      <style>{`
        @media (max-width: 900px) {
          .storefront-desktop-filters {
            display: none !important;
          }
          .storefront-filter-trigger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
