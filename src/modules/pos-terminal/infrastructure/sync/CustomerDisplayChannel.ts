/**
 * Servicio de Sincronización en Tiempo Real: Terminal POS ↔ Pantalla Cliente (Customer Facing Display)
 * Utiliza BroadcastChannel API con sincronización instantánea inter-pestañas y persistencia de respaldo en localStorage.
 */

export interface CustomerDisplayItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
  taxRate?: number;
}

export interface CustomerDisplayState {
  cashierName: string;
  establishmentName?: string;
  customerName: string;
  lines: CustomerDisplayItem[];
  liquidation: {
    taxableBase: number;
    totalTaxes: number;
    totalWithholdings: number;
    netPayable: number;
  } | null;
  isPaymentInProgress: boolean;
  completedReceipt?: {
    invoiceNumber: string;
    totalCop: number;
    customerName?: string;
  } | null;
  updatedAt: number;
}

const STORAGE_KEY = 'natsar_pos_customer_display_state_v1';
const CHANNEL_NAME = 'natsar_pos_customer_display_channel_v1';

let broadcastChannelInstance: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannelInstance = null;
    }
  }
  return broadcastChannelInstance;
}

/**
 * Emite la actualización de la venta al canal de la pantalla de cliente
 */
export function publishCustomerDisplayState(state: CustomerDisplayState): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: 'STATE_UPDATE', state });
    }
  } catch (err) {
    console.warn('[CustomerDisplay] Error emitiendo estado al visor de cliente:', err);
  }
}

/**
 * Obtiene el último estado disponible desde almacenamiento local
 */
export function getInitialCustomerDisplayState(): CustomerDisplayState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerDisplayState;
  } catch {
    return null;
  }
}

/**
 * Suscribe la pantalla de cliente para escuchar cambios en vivo
 */
export function subscribeCustomerDisplay(
  onUpdate: (state: CustomerDisplayState) => void
): () => void {
  // 1. Escuchar a través de BroadcastChannel
  const channel = getBroadcastChannel();
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'STATE_UPDATE' && event.data.state) {
      onUpdate(event.data.state as CustomerDisplayState);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
    // Solicitar al POS que envíe el estado actual de inmediato
    channel.postMessage({ type: 'REQUEST_CURRENT_STATE' });
  }

  // 2. Escuchar a través del evento Storage como respaldo cross-window
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as CustomerDisplayState;
        onUpdate(parsed);
      } catch {
        // Ignorar JSON malformado
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // Retornar función de limpieza
  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Permite al POS responder solicitudes de estado inicial de una nueva pantalla de cliente abierta
 */
export function listenForCustomerDisplayRequests(
  getCurrentState: () => CustomerDisplayState
): () => void {
  const channel = getBroadcastChannel();
  if (!channel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'REQUEST_CURRENT_STATE') {
      const state = getCurrentState();
      publishCustomerDisplayState(state);
    }
  };

  channel.addEventListener('message', handleMessage);
  return () => {
    channel.removeEventListener('message', handleMessage);
  };
}

/**
 * Abre una nueva ventana o pestaña con la vista de pantalla para el cliente
 */
export function openCustomerDisplayWindow(): Window | null {
  if (typeof window === 'undefined') return null;

  const url = `${window.location.origin}${window.location.pathname}?view=customer-display`;
  let win: Window | null = null;
  try {
    win = window.open(
      url,
      'NatsarCustomerDisplayWindow',
      'width=1150,height=750,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  } catch {
    win = null;
  }

  // Si el navegador bloqueó la ventana emergente tipo popup, abrir como pestaña normal
  if (!win || win.closed || typeof win.closed === 'undefined') {
    win = window.open(url, '_blank');
  }

  win?.focus();
  return win;
}
