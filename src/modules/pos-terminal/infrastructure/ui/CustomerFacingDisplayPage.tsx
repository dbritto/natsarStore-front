import React, { useEffect, useState } from 'react';
import { BrandLogo } from '@shared/components/atoms/BrandLogo';
import { Icon } from '@shared/components/atoms/Icon';
import {
  CustomerDisplayState,
  getInitialCustomerDisplayState,
  subscribeCustomerDisplay,
} from '../sync/CustomerDisplayChannel';

/**
 * Pantalla Orientada al Cliente (Customer Facing Display - CFD)
 * Diseñada para proyectarse en un segundo monitor o pantalla táctil frente al cliente:
 * - Refleja en tiempo real cada producto añadido, modificado o eliminado en la caja POS
 * - Muestra desglose tributario DIAN, subtotal, IVA y Gran Total a pagar en alta visibilidad
 * - Estado de bienvenida interactivo y confirmación de factura emitida
 */
export const CustomerFacingDisplayPage: React.FC = () => {
  const [displayState, setDisplayState] = useState<CustomerDisplayState | null>(() =>
    getInitialCustomerDisplayState()
  );
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Suscribirse a los cambios en vivo del terminal POS
  useEffect(() => {
    const unsubscribe = subscribeCustomerDisplay((newState) => {
      setDisplayState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Alternar pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      void document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const lines = displayState?.lines ?? [];
  const totalItemsCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const netPayable = displayState?.liquidation?.netPayable ?? 0;
  const taxableBase = displayState?.liquidation?.taxableBase ?? 0;
  const totalTaxes = displayState?.liquidation?.totalTaxes ?? 0;

  const formatCop = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;

  return (
    <div
      style={{
        backgroundColor: '#F2F4F9',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header de la Pantalla del Cliente */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <BrandLogo size="md" subtitle="Pantalla de Atención al Cliente" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid #A7F3D0',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            <span>Caja POS Conectada</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {displayState?.cashierName && (
            <div
              style={{
                fontSize: '0.84rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ color: '#94A3B8' }}>Atendido por:</span>
              <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                {displayState.cashierName}
              </strong>
            </div>
          )}

          <div
            style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#4F55F1',
              backgroundColor: 'rgba(79, 85, 241, 0.08)',
              padding: '6px 14px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
            }}
          >
            {currentTime}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name="maximize" size={14} />
            <span>{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
          </button>
        </div>
      </header>

      {/* 2. Cuerpo Principal */}
      <main style={{ flex: 1, padding: '24px 32px 32px', display: 'flex', flexDirection: 'column' }}>
        {/* Caso A: Factura Recién Emitida / Pago Confirmado */}
        {displayState?.completedReceipt ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                padding: '48px 40px',
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.15)',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={34} />
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                ¡Muchas gracias por su compra!
              </h2>

              <p style={{ fontSize: '0.96rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Su pago ha sido procesado y la factura electrónica oficial ha sido emitida ante la DIAN.
              </p>

              <div
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '18px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Comprobante:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 800 }}>
                    {displayState.completedReceipt.invoiceNumber}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Total Pagado:</span>
                  <strong style={{ color: '#4F55F1', fontWeight: 900 }}>
                    {formatCop(displayState.completedReceipt.totalCop)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.84rem', fontWeight: 700, marginTop: '8px' }}>
                <Icon name="receipt" size={16} />
                <span>Documento tributario legal DIAN validado</span>
              </div>
            </div>
          </div>
        ) : lines.length === 0 ? (
          /* Caso B: Carrito Vacío / Estado de Bienvenida Esperando Artículos */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '28px',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(79, 85, 241, 0.1)',
                  color: '#4F55F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Icon name="store" size={38} />
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 3rem)',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-1px',
                  margin: '0 0 12px',
                  lineHeight: 1.15,
                }}
              >
                ¡Bienvenido a <span style={{ color: '#4F55F1' }}>NatsarStore</span>!
              </h1>

              <p
                style={{
                  fontSize: '1.1rem',
                  color: '#64748B',
                  lineHeight: 1.5,
                  margin: '0 auto',
                  maxWidth: '520px',
                }}
              >
                Presente sus artículos en el mostrador. En cuanto el cajero comience a registrar sus productos, verá el detalle y el valor a pagar en esta pantalla.
              </p>
            </div>

            {/* Tarjetas informativas de confianza */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                maxWidth: '820px',
                width: '100%',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(79, 85, 241, 0.08)',
                    color: '#4F55F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="receipt" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                    Facturación DIAN
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Emisión con QR y CUFE oficial
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    color: '#F97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="shield" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                    Pagos Múltiples
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Efectivo, tarjetas y transferencias
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkles" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                    Atención Inmediata
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Servicio ágil y transparente
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Caso C: Venta Activa (Artículos en curso) */
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(400px, 1.4fr) minmax(320px, 1fr)',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Columna Izquierda: Tabla de Artículos Registrados */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: 'calc(100vh - 160px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Artículos en su compra
                  </h2>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: '#4F55F1',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {totalItemsCount} {totalItemsCount === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
                {displayState?.customerName && (
                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                    Cliente: <strong style={{ color: '#0F172A' }}>{displayState.customerName}</strong>
                  </span>
                )}
              </div>

              {/* Lista desplazable de productos */}
              <div
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingRight: '6px',
                }}
              >
                {lines.map((line, index) => {
                  const isLatest = index === lines.length - 1;
                  return (
                    <div
                      key={line.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        backgroundColor: isLatest ? 'rgba(79, 85, 241, 0.04)' : '#F8FAFC',
                        border: isLatest ? '1.5px solid #4F55F1' : '1px solid #E2E8F0',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {line.imageUrl ? (
                            <img
                              src={line.imageUrl}
                              alt={line.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <Icon name="package" size={20} style={{ color: '#94A3B8' }} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.94rem',
                              fontWeight: 700,
                              color: '#0F172A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {line.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                            {formatCop(line.unitPrice)} c/u
                          </div>
                        </div>
                      </div>

                      {/* Cantidad y Subtotal */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            color: '#0F172A',
                          }}
                        >
                          × {line.quantity}
                        </span>

                        <span
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            minWidth: '95px',
                            textAlign: 'right',
                          }}
                        >
                          {formatCop(line.lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Gigante de Total y Desglose DIAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tarjeta Visual de Gran Total a Pagar */}
              <div
                style={{
                  background: 'linear-gradient(145deg, #565cf6 0%, #3d42d9 55%, #2e31a6 100%)',
                  color: '#FFFFFF',
                  borderRadius: '26px',
                  padding: '30px 26px',
                  boxShadow: '0 16px 36px -8px rgba(79, 85, 241, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9 }}>
                    Total a Pagar
                  </span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    COP
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
                    fontWeight: 900,
                    letterSpacing: '-1px',
                    lineHeight: 1.1,
                  }}
                >
                  {formatCop(netPayable)}
                </div>

                {displayState?.isPaymentInProgress && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <Icon name="refresh" size={16} />
                    <span>Cobro en proceso por parte del cajero...</span>
                  </div>
                )}
              </div>

              {/* Tarjeta de Desglose Tributario DIAN */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Resumen de Liquidación Fiscal
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748B' }}>
                  <span>Subtotal Base:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                    {formatCop(taxableBase)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748B' }}>
                  <span>Impuestos DIAN (IVA / INC):</span>
                  <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                    {formatCop(totalTaxes)}
                  </strong>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.96rem',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>Valor Total:</span>
                  <strong style={{ fontWeight: 900, color: '#4F55F1' }}>
                    {formatCop(netPayable)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
