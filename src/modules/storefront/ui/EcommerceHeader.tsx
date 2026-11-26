import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { BrandLogo } from '@shared/components/atoms/BrandLogo';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';

export interface EcommerceHeaderProps {
  session?: UserSession | null;
  cartCount?: number;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onOpenLogin: () => void;
  onGoToWorkspace?: () => void;
  onLogout?: () => void;
  onSearchClick?: () => void;
  onLogoClick?: () => void;
  onCartClick?: () => void;
}

/**
 * Barra Superior E-Commerce Unificada con el Panel Administrativo:
 * - Paleta Corporativa idéntica al admin: Royal Indigo (#4F55F1), bordes #E2E8F0, canvas #F2F4F9
 * - BrandLogo oficial NatsarStore
 * - 100% Mobile Responsive: En pantallas pequeñas el buscador no colisiona con los botones
 * - Botón de Login y Bolsa sin sobreposición
 */
export const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  session,
  cartCount = 0,
  searchValue = '',
  onSearchChange,
  onOpenLogin,
  onGoToWorkspace,
  onLogout,
  onLogoClick,
  onCartClick,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const prevCartCountRef = useRef(cartCount);

  // Animación suave cuando cambia la cantidad en la bolsa
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartPulse(true);
      const timer = setTimeout(() => setCartPulse(false), 500);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Atajo de teclado (tecla '/' o 'Escape' para enfocar/desenfocar buscador)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsMobileSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Fila Principal de Navegación */}
      <div
        className="storefront-header-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Lado Izquierdo: BrandLogo oficial NatsarStore (idéntico al admin) */}
        <div
          onClick={() => onLogoClick && onLogoClick()}
          title="NatsarStore - Ir al inicio del catálogo"
          style={{
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <BrandLogo size="sm" subtitle="Tienda Online" />
        </div>

        {/* Centro (Desktop): Buscador Integrado en Línea */}
        <div
          className="storefront-desktop-search"
          style={{
            flex: 1,
            maxWidth: '460px',
            margin: '0 16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#F8FAFC',
              borderRadius: '999px',
              border: '1.5px solid #E2E8F0',
              padding: '2px 8px 2px 14px',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
          >
            <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              <Icon name="search" size={15} />
            </div>

            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar productos, marcas, referencias... (pulsa /)"
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                padding: '7px 8px',
                fontSize: '0.84rem',
                color: '#0F172A',
                minWidth: 0,
              }}
            />

            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                title="Borrar búsqueda"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <Icon name="x" size={14} />
              </button>
            ) : (
              <kbd
                style={{
                  fontSize: '0.66rem',
                  color: '#94A3B8',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontFamily: 'monospace',
                  userSelect: 'none',
                }}
              >
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Lado Derecho: Acciones (Buscar móvil + Iniciar sesión / POS + Bolsa) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* Botón de lupa exclusivo para móvil para alternar barra de búsqueda */}
          <button
            type="button"
            className="storefront-mobile-search-toggle"
            onClick={() => {
              setIsMobileSearchOpen((prev) => !prev);
              if (!isMobileSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 60);
              }
            }}
            aria-label="Buscar productos"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isMobileSearchOpen ? '#4F55F1' : '#F8FAFC',
              color: isMobileSearchOpen ? '#FFFFFF' : '#475569',
              border: '1px solid #E2E8F0',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon name={isMobileSearchOpen ? 'x' : 'search'} size={15} />
          </button>

          {/* BOTÓN DE LOGIN EN LA PARTE SUPERIOR DERECHA */}
          {!session ? (
            <button
              type="button"
              onClick={onOpenLogin}
              aria-label="Acceder a la aplicación"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '999px',
                backgroundColor: '#4F55F1',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 85, 241, 0.25)',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3F44D9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4F55F1';
              }}
            >
              <Icon name="user" size={14} />
              <span className="storefront-header-btn-text">Iniciar sesión</span>
            </button>
          ) : (
            /* Usuario con sesión activa: Acceso al Workspace POS del admin */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onGoToWorkspace}
                title="Ir al Terminal de Punto de Venta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  backgroundColor: '#4F55F1',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 85, 241, 0.25)',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                  }}
                >
                  {session.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="storefront-header-btn-text">Panel POS</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar sesión"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="logout" size={14} />
                </button>
              )}
            </div>
          )}

          {/* Botón / Píldora de Bolsa */}
          <button
            type="button"
            onClick={onCartClick}
            aria-label={`Ver bolsa con ${cartCount} productos`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: '#FFFFFF',
              border: cartCount > 0 ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
              color: '#0F172A',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: cartPulse ? 'scale(1.08)' : 'scale(1)',
              flexShrink: 0,
            }}
          >
            <Icon name="shopping-bag" size={15} style={{ color: cartCount > 0 ? '#4F55F1' : '#475569' }} />
            <span className="storefront-header-btn-text">Bolsa</span>
            <span
              style={{
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '999px',
                backgroundColor: cartCount > 0 ? '#4F55F1' : '#94A3B8',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Fila 2 (Móvil): Buscador Desplegable para pantallas móviles (evita sobreposiciones) */}
      {isMobileSearchOpen && (
        <div
          className="storefront-mobile-search-row"
          style={{
            padding: '0 16px 12px',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#F8FAFC',
              borderRadius: '999px',
              border: '1.5px solid #4F55F1',
              padding: '4px 10px 4px 12px',
            }}
          >
            <Icon name="search" size={15} style={{ color: '#4F55F1', marginRight: '6px' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar en el catálogo..."
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '0.86rem',
                color: '#0F172A',
                minWidth: 0,
              }}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '2px',
                  cursor: 'pointer',
                }}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reglas de visualización CSS responsive para el header */}
      <style>{`
        @media (max-width: 768px) {
          .storefront-header-inner {
            padding: 10px 14px !important;
            gap: 8px !important;
          }
          .storefront-desktop-search {
            display: none !important;
          }
          .storefront-mobile-search-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .storefront-header-btn-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
