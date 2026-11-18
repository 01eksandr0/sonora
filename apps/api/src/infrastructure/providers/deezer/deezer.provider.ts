import { Injectable } from '@nestjs/common'
import type {
  AlbumDetails,
  ArtistDetails,
  ChartResult,
  Genre,
  SearchResult,
  TrackDetails,
  Paginated,
  TrackSummary,
} from '@music-app/shared-types'
import type { MusicProvider } from '../music-provider.interface.js'
import { DeezerHttpClient } from './deezer-http.client.js'
import { DeezerMapper } from './deezer.mapper.js'
import type {
  DeezerAlbumDto,
  DeezerArtistDto,
  DeezerChartDto,
  DeezerGenreDto,
  DeezerPaginatedResponse,
  DeezerTrackDto,
} from './deezer.types.js'

@Injectable()
export class DeezerProvider implements MusicProvider {
  constructor(private readonly http: DeezerHttpClient) {}

  async search(query: string, limit = 25, offset = 0): Promise<SearchResult> {
    const normalizedQuery = query.trim()

    const [tracksRes, albumsRes, artistsRes] = await Promise.all([
      this.http.get<DeezerPaginatedResponse<DeezerTrackDto>>('/search/track', {
        q: normalizedQuery,
        limit,
        index: offset,
      }),
      this.http.get<DeezerPaginatedResponse<DeezerAlbumDto>>('/search/album', {
        q: normalizedQuery,
        limit,
        index: offset,
      }),
      this.http.get<DeezerPaginatedResponse<DeezerArtistDto>>('/search/artist', {
        q: normalizedQuery,
        limit,
        index: offset,
      }),
    ])

    return {
      tracks: DeezerMapper.toPaginated(tracksRes, limit, offset, (item) =>
        DeezerMapper.toTrackSummary(item),
      ),
      albums: DeezerMapper.toPaginated(albumsRes, limit, offset, (item) =>
        DeezerMapper.toAlbumDetails(item),
      ),
      artists: DeezerMapper.toPaginated(artistsRes, limit, offset, (item) =>
        DeezerMapper.toArtistDetails(item),
      ),
    }
  }

  async getTrack(id: string): Promise<TrackDetails> {
    const dto = await this.http.get<DeezerTrackDto>(`/track/${encodeURIComponent(id)}`)

    return DeezerMapper.toTrackDetails(dto)
  }

  async getAlbum(id: string): Promise<AlbumDetails> {
    const dto = await this.http.get<DeezerAlbumDto>(`/album/${encodeURIComponent(id)}`)

    return DeezerMapper.toAlbumDetails(dto)
  }

  async getArtist(id: string): Promise<ArtistDetails> {
    const dto = await this.http.get<DeezerArtistDto>(`/artist/${encodeURIComponent(id)}`)

    return DeezerMapper.toArtistDetails(dto)
  }

  async getArtistTopTracks(id: string, limit = 25, offset = 0): Promise<Paginated<TrackSummary>> {
    const response = await this.http.get<DeezerPaginatedResponse<DeezerTrackDto>>(
      `/artist/${encodeURIComponent(id)}/top`,
      {
        limit,
        index: offset,
      },
    )

    return DeezerMapper.toPaginated(response, limit, offset, (item) =>
      DeezerMapper.toTrackSummary(item),
    )
  }

  async getGenres(): Promise<Genre[]> {
    const response = await this.http.get<{
      data: DeezerGenreDto[]
    }>('/genre')

    return response.data.map((item) => DeezerMapper.toGenre(item))
  }

  async getCharts(): Promise<ChartResult> {
    const dto = await this.http.get<DeezerChartDto>('/chart')

    return DeezerMapper.toChartResult(dto)
  }
}
