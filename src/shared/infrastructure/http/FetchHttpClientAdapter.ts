import { FriendlyErrorMapper } from '@shared/domain/FriendlyErrorMapper';
import { ApiEnvelope, HttpClientPort, HttpRequestOptions } from './HttpClientPort';

/**
 * Adaptador de Salida (Driven Adapter) HTTP de NatsarStore:
 * - Inyecta automáticamente X-Request-ID (UUID v4 para idempotencia)
 * - Inyecta X-Channel-ID: 'WEB' y Accept-Language: 'es-CO'
 * - Suaviza cualquier fallo HTTP o de red mediante FriendlyErrorMapper para no exponer
 *   jamás códigos de estado (400, 401, 500, etc.) ni errores técnicos al cliente.
 */
export class FetchHttpClientAdapter implements HttpClientPort {
  private readonly baseUrl: string;
  private readonly getAccessToken: () => string | null;

  constructor(baseUrl?: string, getAccessToken: () => string | null = () => null) {
    const envUrl = (import.meta.env?.VITE_API_URL as string | undefined) ?? '';
    this.baseUrl = (baseUrl ?? envUrl).replace(/\/+$/, '');
    this.getAccessToken = getAccessToken;
  }

  private buildHeaders(isMutation: boolean, custom?: Record<string, string>): Record<string, string> {
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const headers: Record<string, string> = {
      'X-Request-ID': requestId,
      'X-Channel-ID': 'WEB',
      'Accept-Language': 'es-CO',
      ...custom,
    };

    if (isMutation) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const raw = `${this.baseUrl}${path}`;
    if (!params) return raw;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    return qs ? `${raw}?${qs}` : raw;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<ApiEnvelope<T>> {
    try {
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

      const response = await fetch(this.buildUrl(url, options?.params), {
        method,
        headers: this.buildHeaders(isMutation && !isFormData, options?.headers),
        body: isMutation && body !== undefined ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
        signal: options?.signal,
      });

      const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
      if (!response.ok) {
        const friendly = FriendlyErrorMapper.fromHttpStatus(
          response.status,
          json?.error || json?.message
        );
        return {
          success: false,
          error: friendly.message,
        };
      }

      return (
        json ?? {
          success: true,
        }
      );
    } catch {
      const friendly = FriendlyErrorMapper.fromNetworkError();
      return {
        success: false,
        error: friendly.message,
      };
    }
  }

  public get<T>(url: string, options?: HttpRequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  public post<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>('POST', url, body, options);
  }

  public put<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>('PUT', url, body, options);
  }

  public patch<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>('PATCH', url, body, options);
  }

  public delete<T>(url: string, options?: HttpRequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }
}
