import React from 'react';
import { Icon } from '@shared/components/atoms/Icon';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';

export interface EcommerceHeaderProps {
  session?: UserSession | null;
  cartCount?: number;
  onOpenLogin: () => void;
  onGoToWorkspace?: () => void;
  onLogout?: () => void;
  onSearchClick?: () => void;
  onLogoClick?: () => void;
  onCartClick?: () => void;
}

/**
 * Barra Superior de Navegación E-Commerce (Inspirada en el diseño de referencia)
 * - Botón de Búsqueda circular
 * - Logotipo 'Factus.' con tipografía limpia y minimalista
 * - BOTÓN DE LOGIN EN LA PARTE SUPERIOR DERECHA para acceder a la aplicación
 * - Contador de Bolsa / Bag
 */
export const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  session,
  cartCount = 0,
  onOpenLogin,
  onGoToWorkspace,
  onLogout,
  onSearchClick,
  onLogoClick,
  onCartClick,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
        backgroundColor: '#F5F4F0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
        width: '100%',
      }}
    >
      {/* Lado Izquierdo: Botón buscar + Logotipo 'Factus.' + Píldoras de navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Botón de búsqueda circular */}
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Abrir buscador rápido"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '999px',
            backgroundColor: '#18181B',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#18181B';
          }}
        >
          <Icon name="search" size={17} />
        </button>

        {/* Marca / Logotipo estilo Hollis. */}
        <div
          onClick={() => onLogoClick && onLogoClick()}
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
            <span>Iniciar sesión</span>
          </button>
        ) : (
          /* Usuario con sesión activa: Acceso directo al Workspace + Cerrar sesión */
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onGoToWorkspace}
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
              <span>Panel POS</span>
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

        {/* Píldora de Bolsa / Bag estilo 'Bag 0' */}
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E5E5',
            color: '#18181B',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#A1A1AA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E5E5';
          }}
        >
          <span>Bag</span>
          <span
            style={{
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '999px',
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              fontSize: '0.72rem',
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
    </header>
  );
};
