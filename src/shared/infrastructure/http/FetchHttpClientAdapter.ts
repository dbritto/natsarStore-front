import { ApiEnvelope, HttpClientPort, HttpRequestOptions } from './HttpClientPort';

/**
 * Adaptador de Salida (Driven Adapter) HTTP que implementa el contrato del Shared Kernel del Backend Factus POS:
 * - Inyecta automáticamente X-Request-ID (UUID v4 para idempotencia y prevención de doble clic)
 * - Inyecta X-Channel-ID: 'WEB'
 * - Inyecta Accept-Language: 'es-CO'
 * - Inyecta Authorization: Bearer <accessToken> cuando existe sesión activa
 */
export class FetchHttpClientAdapter implements HttpClientPort {
  private readonly baseUrl: string;
  private readonly getAccessToken: () => string | null;

  constructor(baseUrl = '', getAccessToken: () => string | null = () => null) {
    this.baseUrl = baseUrl;
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
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const response = await fetch(this.buildUrl(url, options?.params), {
      method,
      headers: this.buildHeaders(isMutation, options?.headers),
      body: isMutation && body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    if (!response.ok) {
      return {
        success: false,
        error: json?.error || json?.message || `Error HTTP ${response.status}`,
      };
    }

    return (
      json ?? {
        success: true,
      }
    );
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
