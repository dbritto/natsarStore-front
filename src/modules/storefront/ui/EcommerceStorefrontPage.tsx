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

const FREE_SHIPPING_THRESHOLD = 150000;

/**
 * Página Principal Tienda E-Commerce (Front Storefront)
 * Inspirada en el diseño visual de referencia (Hollis / Claymorphism escandinavo limpio).
 * Carga productos de la tienda inmediatamente, incluye slider horizontal para filtrar por categoría,
 * buscador inteligente en tiempo real, chips de filtros activos, notificaciones toast,
 * barra de progreso para envío gratis en la bolsa, y botón de login en la parte superior derecha.
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

  // Manejador para añadir a la bolsa con soporte para cantidad y toast
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

    // Mostrar feedback visual Toast
    setActiveToast({
      id: `${Date.now()}-${product.id}`,
      productName: product.name,
    });
  };

  // Auto-descartar toast después de 3.5 segundos
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 3500);
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

  // Progreso hacia envío gratis
  const freeShippingProgress = Math.min(100, Math.round((totalCartPrice / FREE_SHIPPING_THRESHOLD) * 100));
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalCartPrice);

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
        backgroundColor: '#F5F4F0',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#18181B',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header con Buscador Inteligente en Tiempo Real, Logotipo y Botón de Login */}
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

      <main style={{ width: '100%', padding: '0 32px 60px', flex: 1, boxSizing: 'border-box' }}>
        {/* 2. Banner Hero Display inspirado en Hollis Body Care */}
        <EcommerceHero
          categoryTitle={heroTitle}
          categorySubtitle={heroSubtitle}
          onFeaturedClick={() => {
            const firstProduct = filteredProducts[0];
            if (firstProduct) setSelectedProductDetail(firstProduct);
          }}
        />

        {/* 3. Slider de Categorías interactivo con botones ‹ › y arrastre suave */}
        <div style={{ padding: '0 0 10px 0', width: '100%' }}>
          <CategorySlider
            categories={categorySliderItems}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            totalProductsCount={products.length}
          />
        </div>

        {/* 4. Barra Superior de Control de Cuadrícula & Chips de Filtros Activos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            width: '100%',
          }}
        >
          {/* Fila de Conteo, Botón Móvil y Selector de Ordenamiento */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#18181B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{filteredProducts.length} productos</span>
              {isLoading && (
                <span style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 400 }}>
                  (actualizando...)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <span style={{ fontSize: '0.82rem', color: '#71717A', fontWeight: 500 }}>
                  Ordenar por:
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  aria-label="Ordenar productos"
                  style={{
                    padding: '7px 30px 7px 14px',
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
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
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

          {/* CHIPS DE FILTROS ACTIVOS (Mejor práctica de usabilidad y transparencia Baymard Institute) */}
          {isFilterActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(6px)',
                borderRadius: '16px',
                border: '1px solid #ECEAE4',
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#71717A', marginRight: '4px' }}>
                Filtros activos:
              </span>

              {/* Chip Categoría */}
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Categoría: {activeCategory?.name ?? 'Seleccionada'}</span>
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Chip Búsqueda */}
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Texto: "{filters.search}"</span>
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Chip Formato */}
              {filters.format !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, format: 'all' }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Formato: {filters.format}</span>
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Chip Precio */}
              {filters.maxPrice < 500000 && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, maxPrice: 500000 }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Hasta ${filters.maxPrice.toLocaleString('es-CO')}</span>
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Chip Stock */}
              {filters.inStockOnly && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, inStockOnly: false }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Solo en stock</span>
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Botón Limpiar Todo */}
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F97316',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 6px',
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}
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
              /* Estado sin resultados intuitivo */
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '28px',
                  padding: '56px 24px',
                  textAlign: 'center',
                  border: '1px solid #ECEAE4',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F3ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#71717A',
                  }}
                >
                  <Icon name="search" size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181B', margin: 0 }}>
                  No encontramos resultados para tu búsqueda
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#71717A', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                  Verifica que los términos estén bien escritos o amplía el rango de precio para explorar más opciones en el catálogo.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    marginTop: '6px',
                    padding: '10px 24px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(24,24,27,0.15)',
                  }}
                >
                  Restablecer filtros y ver todo
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

        {/* 6. Barra de Confianza y Propuesta de Valor (Estándar Global E-Commerce) */}
        <section
          style={{
            marginTop: '64px',
            padding: '36px 28px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid #ECEAE4',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#F5F3ED',
                color: '#18181B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="truck" size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px', color: '#18181B' }}>
                Envíos a todo el país
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#71717A', margin: 0, lineHeight: 1.4 }}>
                Despacho prioritario y empaque de alta seguridad. Envío gratis desde $150.000.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#F5F3ED',
                color: '#F97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="receipt" size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px', color: '#18181B' }}>
                Facturación DIAN oficial
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#71717A', margin: 0, lineHeight: 1.4 }}>
                Trazabilidad tributaria certificada con CUFE, QR y reporte automático.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#F5F3ED',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="shield" size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px', color: '#18181B' }}>
                Garantía y Calidad 100%
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#71717A', margin: 0, lineHeight: 1.4 }}>
                Productos formulados con pureza certificada y control de lotes estricto.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#F5F3ED',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="store" size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px', color: '#18181B' }}>
                Integrado a Terminal POS
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#71717A', margin: 0, lineHeight: 1.4 }}>
                Sincronización de inventario físico y digital en tiempo real con Factus.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer Editorial Minimalista */}
      <footer
        style={{
          borderTop: '1px solid #ECEAE4',
          backgroundColor: '#FFFFFF',
          padding: '36px 32px 28px',
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
            gap: '16px',
            borderBottom: '1px solid #F4F4F5',
            paddingBottom: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181B' }}>Factus</span>
            <span style={{ color: '#F97316', fontWeight: 900, fontSize: '1.25rem' }}>.</span>
            <span style={{ fontSize: '0.78rem', color: '#71717A', marginLeft: '10px' }}>
              Comercio Electrónico y Facturación POS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: '#52525B' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCategoryId('')}>Catálogo</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }} onClick={onOpenFullLogin}>Acceso Administrativo</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setIsCartDrawerOpen(true)}>Mi Bolsa ({totalCartCount})</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '0.76rem', color: '#A1A1AA' }}>
          <span>© {new Date().getFullYear()} Factus Store. Todos los derechos reservados. Cumplimiento DIAN Anexo 1.9.</span>
          <span>Diseño Escandinavo Minimalista de Alta Conversión</span>
        </div>
      </footer>

      {/* 8. Toast de Notificación Flotante "¡Agregado a la bolsa!" */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#18181B',
            color: '#FFFFFF',
            borderRadius: '999px',
            padding: '10px 18px 10px 14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 150,
            animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={14} />
          </div>
          <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
            Agregado a la bolsa: {activeToast.productName}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveToast(null);
              setIsCartDrawerOpen(true);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#18181B',
              border: 'none',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '4px',
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

      {/* 10. Modal de Ficha Técnica / Detalle del Producto */}
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
              onFilterChange={(f) => setFilters(f)}
              onClearFilters={handleClearFilters}
              isFilterActive={isFilterActive}
              totalResultsCount={filteredProducts.length}
            />
          </div>
        </div>
      )}

      {/* 12. Drawer Lateral de Bolsa / Bag Mejorado con Barra de Envío Gratis */}
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
              maxWidth: '400px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
              boxSizing: 'border-box',
            }}
          >
            {/* Cabecera del drawer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
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
                aria-label="Cerrar bolsa"
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

            {/* Barra de Progreso de Envío Gratis */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: '#F5F4F0',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: totalCartPrice >= FREE_SHIPPING_THRESHOLD ? '#16A34A' : '#52525B',
                }}
              >
                <span>
                  {totalCartPrice >= FREE_SHIPPING_THRESHOLD
                    ? '🎉 ¡Tienes envío gratis a nivel nacional!'
                    : `Agrega $${amountToFreeShipping.toLocaleString('es-CO')} más para envío gratis`}
                </span>
                <span>{freeShippingProgress}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#E5E3DB',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${freeShippingProgress}%`,
                    backgroundColor: totalCartPrice >= FREE_SHIPPING_THRESHOLD ? '#16A34A' : '#18181B',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Lista de productos en bolsa */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#71717A' }}>
                  <Icon name="shopping-bag" size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px', color: '#18181B' }}>
                    Tu bolsa está vacía
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#71717A', margin: '0 0 16px' }}>
                    Explora los productos de la tienda y agrégalos con el botón '+'
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(false)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      backgroundColor: '#18181B',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ver catálogo de productos
                  </button>
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
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
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18181B', marginTop: '2px' }}>
                        {product.formattedPrice}
                      </div>
                    </div>

                    {/* Controles de cantidad (+ / -) y Eliminar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                          aria-label="Restar una unidad"
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
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(product.id, 1)}
                          aria-label="Añadir una unidad"
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

                      {/* Botón eliminar directo */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(product.id)}
                        title="Eliminar producto de la bolsa"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#A1A1AA',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#A1A1AA';
                        }}
                      >
                        <Icon name="trash" size={16} />
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
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#18181B' }}>
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
                    padding: '14px',
                    borderRadius: '999px',
                    backgroundColor: '#18181B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(24,24,27,0.2)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#18181B';
                  }}
                >
                  {session ? 'Procesar en Terminal POS' : 'Iniciar sesión para comprar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estilos CSS responsivos integrados y animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
