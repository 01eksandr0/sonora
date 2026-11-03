import type {
  AlbumDetails,
  ArtistDetails,
  ChartResult,
  Genre,
  Paginated,
  SearchResult,
  TrackDetails,
  TrackSummary,
} from '@music-app/shared-types'

export interface MusicProvider {
  search(query: string, limit?: number, offset?: number): Promise<SearchResult>
  getTrack(id: string): Promise<TrackDetails>
  getAlbum(id: string): Promise<AlbumDetails>
  getArtist(id: string): Promise<ArtistDetails>
  getGenres(): Promise<Genre[]>
  getCharts(): Promise<ChartResult>
  getArtistTopTracks(id: string, limit?: number, offset?: number,): Promise<Paginated<TrackSummary>>
}

export const MUSIC_PROVIDER = Symbol('MUSIC_PROVIDER')
