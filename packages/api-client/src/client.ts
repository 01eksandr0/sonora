import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserWithProfile,
} from '@music-app/shared-types'
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
    auth: {
      register: (body: RegisterRequest) => http.post<AuthResponse>('/auth/register', { body }),
      login: (body: LoginRequest) => http.post<AuthResponse>('/auth/login', { body }),
      logout: () => http.post<{ success: boolean }>('/auth/logout'),
      refresh: () => http.post<AuthResponse>('/auth/refresh'),
      me: () => http.get<UserWithProfile>('/auth/me'),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
