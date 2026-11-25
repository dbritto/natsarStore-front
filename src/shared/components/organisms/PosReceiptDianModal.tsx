import React from 'react';
import { Button } from '../atoms/Button';
import { DialogModal } from '../molecules/DialogModal';
import { Divider } from '../atoms/Divider';

export interface PosReceiptModalLine {
  catalogItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PosReceiptModalData {
  id: string;
  invoiceNumber: string;
  resolutionNumber: string;
  customerName: string;
  customerIdentification: string;
  paymentMethodLabel: string;
  lines: PosReceiptModalLine[];
  taxSummary: {
    taxableBase: number;
    totalTaxes: number;
    totalWithholdings: number;
    netPayable: number;
  };
  paymentMethod: string;
  cashTenderedCop: number;
  changeDueCop: number;
  cufe: string;
}

export interface PosReceiptDianModalProps {
  receipt: PosReceiptModalData | null;
  onClose: () => void;
}

/**
 * Organismo PosReceiptDianModal (Componente Bruto / Presentacional Puro)
 * Representación gráfica de la factura electrónica DIAN (tirilla térmica con QR y CUFE SHA-384).
 */
export const PosReceiptDianModal: React.FC<PosReceiptDianModalProps> = ({
  receipt,
  onClose,
}) => {
  const formatCop = (val: number) => `$ ${val.toLocaleString('es-CO')}`;

  return (
    <DialogModal
      isOpen={Boolean(receipt)}
      title={`Factura Electrónica de Venta: ${receipt?.invoiceNumber ?? ''}`}
      subtitle="Transmitida y validada conforme al Anexo Técnico 1.9 DIAN (UBL 2.1)"
      maxWidth="480px"
      onClose={onClose}
      footer={
        <Button type="button" variant="primary" fullWidth onClick={onClose}>
          Nueva Venta en Caja
        </Button>
      }
    >
      {receipt && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontSize: '0.82rem',
            color: '#0F172A',
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              NATSARSTORE COMERCIAL S.A.S.
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 2px' }}>
              NIT: 901.882.410-5 • Responsable de IVA • Punto de Venta Central
            </p>
            <p style={{ fontSize: '0.73rem', color: '#64748B', margin: 0 }}>
              Resolución DIAN No. {receipt.resolutionNumber}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.79rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Comprobante No.:</span>
              <strong>{receipt.invoiceNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Adquirente:</span>
              <strong>{receipt.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Identificación:</span>
              <strong>{receipt.customerIdentification}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Medio de Pago:</span>
              <strong>{receipt.paymentMethodLabel}</strong>
            </div>
          </div>

          <Divider margin="2px 0" />

          {/* Detalle de Renglones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {receipt.lines.map((line) => (
              <div
                key={line.catalogItemId}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>
                  {line.quantity} x {line.name}
                </span>
                <strong>{formatCop(line.quantity * line.unitPrice)}</strong>
              </div>
            ))}
          </div>

          <Divider margin="2px 0" />

          {/* Totales de la Tirilla */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Subtotal Base:</span>
              <strong>{formatCop(receipt.taxSummary.taxableBase)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Total Impuestos (IVA/INC):</span>
              <strong>+ {formatCop(receipt.taxSummary.totalTaxes)}</strong>
            </div>
            {receipt.taxSummary.totalWithholdings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                <span>Retenciones Practicadas:</span>
                <strong>- {formatCop(receipt.taxSummary.totalWithholdings)}</strong>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#4D53F4',
                paddingTop: '4px',
              }}
            >
              <span>TOTAL NETO PAGADO:</span>
              <span>{formatCop(receipt.taxSummary.netPayable)}</span>
            </div>

            {receipt.paymentMethod === 'CASH' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#047857' }}>
                <span>Recibido: {formatCop(receipt.cashTenderedCop)}</span>
                <strong>Cambio: {formatCop(receipt.changeDueCop)}</strong>
              </div>
            )}
          </div>

          {/* Código QR DIAN & CUFE */}
          <div
            style={{
              marginTop: '6px',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
              <rect width="96" height="96" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
              <rect x="10" y="10" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
              <rect x="16" y="16" width="12" height="12" fill="#0F172A" />
              <rect x="62" y="10" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
              <rect x="68" y="16" width="12" height="12" fill="#0F172A" />
              <rect x="10" y="62" width="24" height="24" rx="3" stroke="#0F172A" strokeWidth="4" />
              <rect x="16" y="68" width="12" height="12" fill="#0F172A" />
              <rect x="42" y="14" width="10" height="10" fill="#4D53F4" />
              <rect x="40" y="40" width="16" height="16" rx="3" fill="#4D53F4" />
              <rect x="64" y="44" width="18" height="8" fill="#0F172A" />
              <rect x="42" y="66" width="12" height="18" fill="#0F172A" />
              <rect x="62" y="62" width="22" height="22" rx="4" stroke="#4D53F4" strokeWidth="4" />
            </svg>

            <div style={{ width: '100%' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block' }}>
                CUFE (SHA-384 DIAN UBL 2.1):
              </span>
              <code
                style={{
                  display: 'block',
                  fontSize: '0.66rem',
                  color: '#64748B',
                  wordBreak: 'break-all',
                  marginTop: '3px',
                }}
              >
                {receipt.cufe}
              </code>
            </div>
          </div>
        </div>
      )}
    </DialogModal>
  );
};
