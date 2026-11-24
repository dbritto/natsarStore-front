/**
 * Puerto de Salida (Driven Port) para comunicaciones HTTP del Frontend.
 * Desacopla los casos de uso y repositorios de fetch/axios.
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HttpClientPort {
  get<T>(url: string, options?: HttpRequestOptions): Promise<ApiEnvelope<T>>;
  post<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>>;
  put<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>>;
  patch<T, B = unknown>(url: string, body?: B, options?: HttpRequestOptions): Promise<ApiEnvelope<T>>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<ApiEnvelope<T>>;
}
