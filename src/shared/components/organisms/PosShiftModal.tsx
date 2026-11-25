import React from 'react';
import { Button } from '../atoms/Button';
import { DialogModal } from '../molecules/DialogModal';
import { Divider } from '../atoms/Divider';
import { FormField } from '../molecules/FormField';

export interface PosShiftModalProps {
  isOpen: boolean;
  isShiftActive: boolean;
  shiftCode: string;
  openingCashCop: number;
  cashSalesCop: number;
  expectedDrawerCashCop: number;
  openingCashInput: string;
  onChangeOpeningCash: (val: string) => void;
  countedClosingCashInput: string;
  onChangeCountedClosingCash: (val: string) => void;
  onConfirmOpenShift: () => void;
  onConfirmCloseShift: () => void;
  onClose: () => void;
}

/**
 * Organismo PosShiftModal (Componente Bruto / Presentacional Puro)
 * Modal de apertura o arqueo y cierre del turno de caja POS.
 */
export const PosShiftModal: React.FC<PosShiftModalProps> = ({
  isOpen,
  isShiftActive,
  shiftCode,
  openingCashCop,
  cashSalesCop,
  expectedDrawerCashCop,
  openingCashInput,
  onChangeOpeningCash,
  countedClosingCashInput,
  onChangeCountedClosingCash,
  onConfirmOpenShift,
  onConfirmCloseShift,
  onClose,
}) => {
  const formatCop = (val: number) => `$ ${val.toLocaleString('es-CO')}`;

  return (
    <DialogModal
      isOpen={isOpen}
      title={
        isShiftActive
          ? `Arqueo y Cierre de Turno (${shiftCode})`
          : 'Apertura de Nuevo Turno de Caja POS'
      }
      subtitle={
        isShiftActive
          ? 'Verifica el efectivo físico en gaveta antes de cerrar el turno del cajero'
          : 'Registra el fondo base en efectivo para habilitar la facturación en mostrador'
      }
      maxWidth="500px"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {isShiftActive ? (
            <Button type="button" variant="primary" onClick={onConfirmCloseShift}>
              Confirmar Arqueo y Cerrar Turno
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={onConfirmOpenShift}>
              Abrir Turno de Caja
            </Button>
          )}
        </>
      }
    >
      {isShiftActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Base Inicial Apertura:</span>
              <strong>{formatCop(openingCashCop)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>+ Ventas en Efectivo:</span>
              <strong>{formatCop(cashSalesCop)}</strong>
            </div>
            <Divider margin="4px 0" />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4D53F4' }}>
              <span style={{ fontWeight: 700 }}>Efectivo Esperado en Gaveta:</span>
              <strong>{formatCop(expectedDrawerCashCop)}</strong>
            </div>
          </div>

          <FormField
            type="number"
            label="Efectivo Físico Contado en Gaveta (COP)*"
            value={countedClosingCashInput}
            onChange={(e) => onChangeCountedClosingCash(e.target.value)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField
            type="number"
            label="Saldo Base Inicial en Efectivo (COP)*"
            value={openingCashInput}
            onChange={(e) => onChangeOpeningCash(e.target.value)}
          />
        </div>
      )}
    </DialogModal>
  );
};
