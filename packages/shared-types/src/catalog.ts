import type { ImageSet } from './image.js'
import type { Paginated } from './pagination.js'
import type { ProviderReference } from './provider.js'

export interface TrackSummary extends ProviderReference {
  title: string
  titleVersion: string | null
  duration: number
  previewUrl: string | null
  explicit: boolean
  artist: { provider: string; providerId: string; name: string }
  album: { provider: string; providerId: string; title: string; cover: ImageSet }
}

export interface TrackDetails extends TrackSummary {
  rank: number | null
  bpm: number | null
  releaseDate: string | null
}

export interface AlbumSummary extends ProviderReference {
  title: string
  artist: { provider: string; providerId: string; name: string }
  cover: ImageSet
  releaseDate: string | null
}

export interface AlbumDetails extends AlbumSummary {
  tracksCount: number | null
  duration: number | null
  explicit: boolean
  tracks?: TrackSummary[]
}

export interface ArtistSummary extends ProviderReference {
  name: string
  images: ImageSet
}

export interface ArtistDetails extends ArtistSummary {
  albumsCount: number | null
  fansCount: number | null
}

export interface Genre extends ProviderReference {
  name: string
  images: ImageSet
}

export interface SearchResult {
  tracks: Paginated<TrackSummary>
  albums: Paginated<AlbumSummary>
  artists: Paginated<ArtistSummary>
}

export interface ChartResult {
  tracks: TrackSummary[]
  albums: AlbumSummary[]
  artists: ArtistSummary[]
}
