import { HttpClient, type HttpClientOptions } from './http.js'

export interface HealthResponse {
  status: 'ok' | 'error'
  checks: Record<string, 'up' | 'down'>
  timestamp: string
}

/**
 * Typed API client. Domain namespaces (catalog, playlists, library, history…)
 * are added here as the corresponding backend modules appear.
 */
export function createApiClient(options: HttpClientOptions) {
  const http = new HttpClient(options)

  return {
    http,
    health: {
      check: () => http.get<HealthResponse>('/health'),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
