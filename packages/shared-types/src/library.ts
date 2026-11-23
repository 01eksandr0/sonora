import type { MusicProviderName } from './provider.js'

export interface FavoriteTrackSummary {
  id: string
  provider: MusicProviderName
  providerId: string
  title: string
  artistName: string
  albumTitle: string | null
  coverUrl: string | null
  duration: number
  createdAt: string
}

export interface FavoriteStatusResponse {
  [trackProviderId: string]: boolean
}
