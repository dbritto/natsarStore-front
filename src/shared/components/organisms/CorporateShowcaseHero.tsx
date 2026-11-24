import React from 'react';
import { Typography } from '../atoms/Typography';

/**
 * Organismo CorporateShowcaseHero:
 * Panel visual corporativo minimalista (Estilo Indigo Dashboard Card) para NatsarStore.
 */
export const CorporateShowcaseHero: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        background: 'var(--brand-gradient)',
        borderRadius: '22px',
        padding: '44px 38px 36px',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Círculo de luz suave decorativo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Mensaje Corporativo Minimalista */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Typography
          as="h2"
          variant="display"
          tone="inverse"
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '14px',
          }}
        >
          Simplifica la gestión con nuestro dashboard
        </Typography>
        <Typography
          variant="body"
          style={{
            color: 'rgba(255, 255, 255, 0.84)',
            fontSize: '0.9rem',
            maxWidth: '320px',
            lineHeight: 1.55,
          }}
        >
          Administra tus ventas, facturación, cajas e inventario de NatsarStore desde un panel corporativo ágil e intuitivo.
        </Typography>
      </div>

      {/* Ilustración vectorial 3D-style de estación de trabajo */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '16px',
        }}
      >
        <svg
          width="310"
          height="240"
          viewBox="0 0 310 240"
          fill="none"
          style={{ filter: 'drop-shadow(0 16px 24px rgba(15, 23, 42, 0.25))' }}
        >
          {/* Sombra de piso */}
          <ellipse cx="155" cy="224" rx="118" ry="8" fill="rgba(15, 23, 42, 0.28)" />

          {/* Planta minimalista a la izquierda */}
          <ellipse cx="42" cy="190" rx="11" ry="15" fill="#4ADE80" />
          <ellipse cx="42" cy="176" rx="8" ry="11" fill="#86EFAC" />
          <rect x="35" y="203" width="14" height="17" rx="4" fill="#1E1B4B" />

          {/* Silla */}
          <line x1="158" y1="176" x2="158" y2="218" stroke="#CBD5E1" strokeWidth="4" />
          <path d="M142 218H174" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
          <rect x="136" y="166" width="44" height="12" rx="6" fill="#F472B6" />

          {/* Piernas y zapatos */}
          <path d="M140 162L122 184" stroke="#1E3A8A" strokeWidth="14" strokeLinecap="round" />
          <path d="M174 162L192 184" stroke="#1E3A8A" strokeWidth="14" strokeLinecap="round" />
          <rect x="108" y="180" width="18" height="9" rx="4.5" fill="#F8FAFC" />
          <rect x="188" y="180" width="18" height="9" rx="4.5" fill="#F8FAFC" />

          {/* Torso y brazo saludando */}
          <rect x="132" y="108" width="52" height="44" rx="16" fill="#FFFFFF" />
          <path d="M180 118L204 82" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" />
          <circle cx="207" cy="76" r="6" fill="#FBCFE8" />

          {/* Cabeza */}
          <circle cx="158" cy="84" r="19" fill="#FBCFE8" />
          <ellipse cx="158" cy="67" rx="28" ry="6" fill="#FB7185" />
          <path d="M142 67C142 58 149 53 158 53C167 53 174 58 174 67" fill="#F43F5E" />
          <circle cx="152" cy="83" r="2" fill="#1E1B4B" />
          <circle cx="164" cy="83" r="2" fill="#1E1B4B" />
          <path d="M154 90C156 92 160 92 162 90" stroke="#1E1B4B" strokeWidth="1.8" strokeLinecap="round" />

          {/* Monitor Principal (Izquierda) */}
          <rect x="64" y="88" width="60" height="44" rx="6" fill="#1E293B" />
          <rect x="86" y="120" width="16" height="26" rx="2" fill="#CBD5E1" />
          <rect x="104" y="96" width="10" height="12" rx="2" fill="#E2E8F0" />
          <line x1="82" y1="74" x2="80" y2="66" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="92" y1="73" x2="92" y2="64" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="102" y1="75" x2="105" y2="67" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

          {/* Portátil Secundario (Derecha) */}
          <rect x="180" y="110" width="38" height="24" rx="4" fill="#991B1B" />
          <rect x="184" y="134" width="30" height="12" rx="2" fill="#64748B" />

          {/* Escritorio Corporativo */}
          <rect x="52" y="144" width="210" height="7" rx="3.5" fill="#1E1B4B" />
          <line x1="74" y1="151" x2="74" y2="220" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round" />
          <line x1="240" y1="151" x2="240" y2="220" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
