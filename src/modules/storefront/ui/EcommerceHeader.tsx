import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@shared/components/atoms/Icon';
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
 * Barra Superior de Navegación E-Commerce de Clase Mundial
 * Inspirada en las mejores prácticas de Shopify, Apple Store y Aesop:
 * - Buscador en tiempo real integrado con autofocus, atajo de teclado y botón limpiar
 * - Logotipo 'Factus.' limpio y minimalista
 * - BOTÓN DE LOGIN / ACCESO RÁPIDO en la esquina superior derecha
 * - Contador de Bolsa interactivo con animación de pulso
 */
export const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  session,
  cartCount = 0,
  searchValue = '',
  onSearchChange,
  onOpenLogin,
  onGoToWorkspace,
  onLogout,
  onSearchClick,
  onLogoClick,
  onCartClick,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const prevCartCountRef = useRef(cartCount);

  // Animación suave cuando cambia la cantidad en la bolsa
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartPulse(true);
      const timer = setTimeout(() => setCartPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Atajo de teclado (tecla '/' o 'Escape' para enfocar/desenfocar buscador)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsSearchExpanded(true);
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        setIsSearchExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchExpanded((prev) => !prev);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (onSearchClick) onSearchClick();
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        backgroundColor: '#F5F4F0',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Lado Izquierdo: Logotipo 'Factus.' y Acceso Directo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          onClick={() => onLogoClick && onLogoClick()}
          title="Factus Store - Ir al inicio"
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: '#18181B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1px',
            userSelect: 'none',
          }}
        >
          <span>Factus</span>
          <span style={{ color: '#F97316', fontWeight: 900 }}>.</span>
        </div>

        {/* Badge descriptivo de tienda oficial */}
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#71717A',
            backgroundColor: '#EAE8E1',
            padding: '3px 10px',
            borderRadius: '999px',
            letterSpacing: '0.3px',
            display: 'none',
          }}
          className="header-store-badge"
        >
          Oficial Store
        </span>
      </div>

      {/* Centro: Buscador Inteligente en Tiempo Real */}
      <div
        style={{
          flex: 1,
          maxWidth: '520px',
          margin: '0 24px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '999px',
            border: isSearchExpanded || searchValue ? '1.5px solid #18181B' : '1px solid #E5E3DB',
            boxShadow:
              isSearchExpanded || searchValue
                ? '0 4px 16px rgba(0,0,0,0.08)'
                : '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: '2px 6px 2px 14px',
          }}
        >
          <div
            style={{
              color: searchValue ? '#18181B' : '#A1A1AA',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => searchInputRef.current?.focus()}
          >
            <Icon name="search" size={16} />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onFocus={() => setIsSearchExpanded(true)}
            onBlur={() => {
              if (!searchValue) setIsSearchExpanded(false);
            }}
            placeholder="Buscar productos, bálsamos, cremas, marcas... (pulsa /)"
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              padding: '8px 10px',
              fontSize: '0.85rem',
              color: '#18181B',
              minWidth: 0,
            }}
          />

          {searchValue ? (
            <button
              type="button"
              onClick={() => {
                if (onSearchChange) onSearchChange('');
                searchInputRef.current?.focus();
              }}
              title="Borrar búsqueda"
              style={{
                background: 'none',
                border: 'none',
                color: '#71717A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                padding: 0,
              }}
            >
              <Icon name="x" size={14} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: '0.68rem',
                color: '#A1A1AA',
                backgroundColor: '#F5F4F0',
                border: '1px solid #E5E3DB',
                borderRadius: '6px',
                padding: '2px 6px',
                fontFamily: 'monospace',
                userSelect: 'none',
              }}
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Lado Derecho: BOTÓN DE LOGIN EN LA PARTE SUPERIOR DERECHA + Bolsa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* BOTÓN DE LOGIN / ACCEDER A LA APLICACIÓN */}
        {!session ? (
          <button
            type="button"
            onClick={onOpenLogin}
            aria-label="Acceder a la aplicación / Iniciar sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(24, 24, 27, 0.18)',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#18181B';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Icon name="user" size={16} />
            <span className="header-login-text">Iniciar sesión</span>
          </button>
        ) : (
          /* Usuario con sesión activa: Acceso directo al Workspace + Cerrar sesión */
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onGoToWorkspace}
              title="Ir a tu terminal de punto de venta y facturación DIAN"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: '#18181B',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#18181B';
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                {session.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="header-workspace-text">Terminal POS</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  color: '#71717A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.borderColor = '#FCA5A5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#71717A';
                  e.currentTarget.style.borderColor = '#E5E5E5';
                }}
              >
                <Icon name="logout" size={16} />
              </button>
            )}
          </div>
        )}

        {/* Píldora de Bolsa / Bag estilo 'Bag 0' con animación dinámica */}
        <button
          type="button"
          onClick={onCartClick}
          aria-label={`Ver bolsa con ${cartCount} productos`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '999px',
            backgroundColor: cartCount > 0 ? '#FFFFFF' : '#FFFFFF',
            border: cartCount > 0 ? '1.5px solid #18181B' : '1px solid #E5E5E5',
            color: '#18181B',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: cartPulse ? 'scale(1.08)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#18181B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = cartCount > 0 ? '#18181B' : '#E5E5E5';
          }}
        >
          <Icon name="shopping-bag" size={16} />
          <span>Bag</span>
          <span
            style={{
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '999px',
              backgroundColor: cartCount > 0 ? '#F97316' : '#18181B',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
          >
            {cartCount}
          </span>
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .header-store-badge {
            display: inline-block !important;
          }
        }
        @media (max-width: 640px) {
          .header-login-text, .header-workspace-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
