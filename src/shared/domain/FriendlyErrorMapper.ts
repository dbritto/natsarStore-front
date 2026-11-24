export type FriendlyNoticeTone = 'info' | 'warning' | 'danger';

export interface FriendlyNotice {
  title: string;
  message: string;
  tone: FriendlyNoticeTone;
  actionLabel?: string;
}

/**
 * Servicio del Shared Kernel (FriendlyErrorMapper)
 * Traduce códigos de estado HTTP y errores técnicos en mensajes cálidos, claros y empáticos
 * para el usuario final, ocultando por completo códigos de estado (400, 401, 500, etc.) y jerga técnica.
 */
export class FriendlyErrorMapper {
  private static readonly TECHNICAL_PATTERNS =
    /http|status|\b[45]\d{2}\b|x-request-id|x-channel-id|accept-language|cabecera|token|jwt|sequelize|sql|exception|typeerror|failed to fetch|networkerror|cors|json|stack|undefined|null/i;

  /**
   * Suaviza respuestas HTTP no exitosas según la categoría de negocio sin exponer el código numérico.
   */
  public static fromHttpStatus(statusCode: number, rawBackendMessage?: string): FriendlyNotice {
    const cleanedCustom = this.sanitizeCustomerMessage(rawBackendMessage);

    switch (statusCode) {
      case 400:
      case 422:
        return {
          title: 'Revisa los datos ingresados',
          message:
            cleanedCustom ||
            'Algunos de los datos proporcionados necesitan revisión. Por favor verifica los campos e inténtalo nuevamente.',
          tone: 'warning',
          actionLabel: 'Revisar datos',
        };

      case 401:
        return {
          title: 'No pudimos validar tu acceso',
          message:
            'El correo electrónico o la contraseña no coinciden con nuestros registros. Verifica tus datos e inténtalo de nuevo.',
          tone: 'warning',
          actionLabel: 'Intentar de nuevo',
        };

      case 403:
        return {
          title: 'Acceso restringido',
          message:
            'Tu perfil actual no cuenta con permisos para realizar esta acción. Si necesitas acceso, comunícate con el administrador de NatsarStore.',
          tone: 'info',
          actionLabel: 'Entendido',
        };

      case 404:
        return {
          title: 'Información no encontrada',
          message:
            'No encontramos el recurso o registro que estás buscando en este momento. Es posible que haya sido movido o actualizado.',
          tone: 'info',
          actionLabel: 'Entendido',
        };

      case 409:
        return {
          title: 'Solicitud en proceso',
          message:
            'Ya estamos procesando esta operación. Por favor espera unos segundos para evitar duplicar la acción.',
          tone: 'info',
          actionLabel: 'Entendido',
        };

      case 429:
        return {
          title: 'Demasiados intentos seguidos',
          message:
            'Por tu seguridad hemos pausado temporalmente las solicitudes. Espera un momento antes de volver a intentarlo.',
          tone: 'warning',
          actionLabel: 'Entendido',
        };

      default:
        if (statusCode >= 500) {
          return {
            title: 'Inconveniente temporal en el servicio',
            message:
              'Estamos presentando una demora inesperada en nuestros servicios. Por favor intenta nuevamente en unos instantes.',
            tone: 'warning',
            actionLabel: 'Entendido',
          };
        }

        return {
          title: 'No pudimos completar la acción',
          message:
            cleanedCustom ||
            'Ocurrió un inconveniente al procesar tu solicitud. Por favor verifica tu información e inténtalo nuevamente.',
          tone: 'warning',
          actionLabel: 'Entendido',
        };
    }
  }

  /**
   * Suaviza errores de red o desconexión cuando el servidor no responde.
   */
  public static fromNetworkError(): FriendlyNotice {
    return {
      title: 'Sin conexión con el servicio',
      message:
        'En este momento no logramos comunicarnos con la plataforma de NatsarStore. Verifica tu conexión a internet o inténtalo nuevamente en unos segundos.',
      tone: 'warning',
      actionLabel: 'Reintentar',
    };
  }

  /**
   * Convierte cualquier mensaje de error de dominio o aplicación en un FriendlyNotice seguro para el modal.
   */
  public static toFriendlyNotice(rawMessage: string, defaultTitle = 'Aviso importante'): FriendlyNotice {
    const lower = (rawMessage ?? '').toLowerCase();

    if (lower.includes('credenciales inválidas') || lower.includes('contraseña')) {
      return {
        title: 'Verifica tus datos de acceso',
        message:
          'El correo o la contraseña ingresados no son correctos. Por favor revísalos con calma e inténtalo nuevamente.',
        tone: 'warning',
        actionLabel: 'Intentar de nuevo',
      };
    }

    if (lower.includes('inactivo')) {
      return {
        title: 'Cuenta pendiente de activación',
        message:
          'Tu cuenta se encuentra temporalmente inactiva. Comunícate con el administrador de NatsarStore para habilitar tu acceso.',
        tone: 'info',
        actionLabel: 'Entendido',
      };
    }

    if (lower.includes('obligatorio') || lower.includes('válido') || lower.includes('caracteres')) {
      return {
        title: 'Completa la información requerida',
        message: rawMessage,
        tone: 'warning',
        actionLabel: 'Revisar campos',
      };
    }

    if (lower.includes('conectar') || lower.includes('conexión')) {
      return this.fromNetworkError();
    }

    const sanitized = this.sanitizeCustomerMessage(rawMessage);
    return {
      title: defaultTitle,
      message:
        sanitized ||
        'No fue posible completar la operación en este momento. Por favor inténtalo nuevamente en unos instantes.',
      tone: 'warning',
      actionLabel: 'Entendido',
    };
  }

  /**
   * Filtra cualquier texto que contenga códigos técnicos, cabeceras HTTP o trazas internas.
   */
  private static sanitizeCustomerMessage(msg?: string | null): string | null {
    if (!msg || typeof msg !== 'string') return null;
    const trimmed = msg.trim();
    if (!trimmed) return null;
    if (this.TECHNICAL_PATTERNS.test(trimmed)) {
      return null;
    }
    return trimmed;
  }
}
