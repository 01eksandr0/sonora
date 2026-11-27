import type {
  AuthResponse,
  CompleteOnboardingRequest,
  LoginRequest,
  OnboardingOptionsResponse,
  RegisterRequest,
  RecommendationCollectionResponse,
  FavoriteStatusResponse,
  FavoriteTrackSummary,
  PlayerEventRequest,
  PlayerEventResponse,
  PlayerState,
  PlayTrackRequest,
  SeekTrackRequest,
  UserWithProfile,
  AlbumDetails,
  AlbumSummary,
  ArtistDetails,
  ChartResult,
  Genre,
  Paginated,
  SearchResult,
  TrackDetails,
  TrackSummary,
} from '@music-app/shared-types'
import { ApiError, HttpClient, type HttpClientOptions } from './http.js'

export interface HealthResponse {
  status: 'ok' | 'error'
  checks: Record<string, 'up' | 'down'>
  timestamp: string
}

/**
 * Typed API client. Domain namespaces are added as their backend modules appear.
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
    onboarding: {
      getOptions: () => http.get<OnboardingOptionsResponse>('/onboarding/options'),
      complete: (body: CompleteOnboardingRequest) =>
        http.post<{ success: boolean }>('/onboarding', { body }),
    },
    catalog: {
      search: (params: { q: string; limit?: number; offset?: number }) =>
        http.get<SearchResult>('/catalog/search', { query: params }),
      getTrack: (id: string) => http.get<TrackDetails>(`/catalog/tracks/${encodeURIComponent(id)}`),
      getAlbum: (id: string) => http.get<AlbumDetails>(`/catalog/albums/${encodeURIComponent(id)}`),
      getArtist: (id: string) =>
        http.get<ArtistDetails>(`/catalog/artists/${encodeURIComponent(id)}`),
      getArtistTopTracks: (id: string, params?: { limit?: number; offset?: number }) =>
        http.get<Paginated<TrackSummary>>(`/catalog/artists/${encodeURIComponent(id)}/top-tracks`, {
          query: params,
        }),
      getArtistAlbums: (id: string, params?: { limit?: number; offset?: number }) =>
        http.get<Paginated<AlbumSummary>>(`/catalog/artists/${encodeURIComponent(id)}/albums`, {
          query: params,
        }),
      getGenres: () => http.get<Genre[]>('/catalog/genres'),
      getCharts: () => http.get<ChartResult>('/catalog/charts'),
    },
    recommendations: {
      getCollection: async () => {
        try {
          return await http.get<RecommendationCollectionResponse>('/recommendations/collection')
        } catch (error) {
          if (error instanceof ApiError && error.status === 202) {
            return { status: 'refreshing' as const, retryAfter: 2 as const }
          }
          throw error
        }
      },
    },
    player: {
      getState: () => http.get<PlayerState>('/player/state'),
      play: (body: PlayTrackRequest) => http.post<PlayerState>('/player/play', { body }),
      pause: () => http.post<PlayerState>('/player/pause'),
      resume: () => http.post<PlayerState>('/player/resume'),
      next: () => http.post<PlayerState>('/player/next'),
      previous: () => http.post<PlayerState>('/player/previous'),
      seek: (body: SeekTrackRequest) => http.post<PlayerState>('/player/seek', { body }),
      emitEvent: (body: PlayerEventRequest) =>
        http.post<PlayerEventResponse>('/player/event', { body }),
    },
    library: {
      addFavoriteTrack: (id: string) =>
        http.post<{ success: boolean }>(`/library/favorites/tracks/${encodeURIComponent(id)}`),
      removeFavoriteTrack: (id: string) =>
        http.delete<{ success: boolean }>(`/library/favorites/tracks/${encodeURIComponent(id)}`),
      getFavoriteStatus: (ids: string[]) =>
        http.get<FavoriteStatusResponse>('/library/favorites/tracks/status', {
          query: { ids: ids.join(',') },
        }),
      getFavorites: (params?: { limit?: number; offset?: number }) =>
        http.get<Paginated<FavoriteTrackSummary>>('/library/favorites/tracks', { query: params }),
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
