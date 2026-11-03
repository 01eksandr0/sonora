
import { Inject, Injectable } from '@nestjs/common'
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
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import {
  MUSIC_PROVIDER,
  type MusicProvider,
} from '../../infrastructure/providers/music-provider.interface.js'

@Injectable()
export class CatalogService {
  constructor(
    @Inject(MUSIC_PROVIDER) private readonly provider: MusicProvider,
    private readonly cache: CacheService,
  ) { }

  async search(
    query: string,
    limit = 25,
    offset = 0,
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim()
    const normalizedQuery = trimmedQuery.toLowerCase()
    const cacheKey = `catalog:search:${normalizedQuery}:${limit}:${offset}`

    return this.cache.getOrSet(
      cacheKey,
      3600,
      () => this.provider.search(trimmedQuery, limit, offset),
    )
  }

  async getTrack(id: string): Promise<TrackDetails> {
    const cacheKey = `catalog:track:${id}`

    return this.cache.getOrSet(
      cacheKey,
      86400,
      () => this.provider.getTrack(id),
    )
  }

  async getAlbum(id: string): Promise<AlbumDetails> {
    const cacheKey = `catalog:album:${id}`

    return this.cache.getOrSet(
      cacheKey,
      86400,
      () => this.provider.getAlbum(id),
    )
  }

  async getArtist(id: string): Promise<ArtistDetails> {
    const cacheKey = `catalog:artist:${id}`

    return this.cache.getOrSet(
      cacheKey,
      86400,
      () => this.provider.getArtist(id),
    )
  }

  async getArtistTopTracks(
    id: string,
    limit = 25,
    offset = 0,
  ): Promise<Paginated<TrackSummary>> {
    const cacheKey = `catalog:artist:${id}:top-tracks:${limit}:${offset}`

    return this.cache.getOrSet(
      cacheKey,
      86400,
      () => this.provider.getArtistTopTracks(id, limit, offset),
    )
  }

  async getGenres(): Promise<Genre[]> {
    const cacheKey = 'catalog:genres'

    return this.cache.getOrSet(
      cacheKey,
      604800,
      () => this.provider.getGenres(),
    )
  }

  async getCharts(): Promise<ChartResult> {
    const cacheKey = 'catalog:charts'

    return this.cache.getOrSet(
      cacheKey,
      7200,
      () => this.provider.getCharts(),
    )
  }
}
