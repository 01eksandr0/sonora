import { Injectable, Logger } from '@nestjs/common'
import type { TrackSummary, PlayerContext } from '@music-app/shared-types'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { CatalogService } from '../catalog/catalog.service.js'

@Injectable()
export class PlayerQueueService {
  private readonly logger = new Logger(PlayerQueueService.name)

  constructor(
    private readonly catalogService: CatalogService,
    private readonly prisma: PrismaService,
  ) {}

  async getUpcomingCandidates(
    currentTrack: TrackSummary,
    context?: PlayerContext,
    excludeIds: Set<string> = new Set(),
    userId?: string,
  ): Promise<TrackSummary[]> {
    const candidates: TrackSummary[] = []

    try {
      if (context?.type === 'collection' && userId) {
        const collection = await this.prisma.recommendationCollection.findUnique({
          where: { userId },
        })
        if (collection && Array.isArray(collection.tracks)) {
          const collectionTracks = collection.tracks as unknown as TrackSummary[]
          const trackIdx = collectionTracks.findIndex(
            (t) => t.providerId === currentTrack.providerId,
          )
          if (trackIdx !== -1) {
            candidates.push(...collectionTracks.slice(trackIdx + 1))
          } else {
            candidates.push(...collectionTracks)
          }
        }
      } else if (context?.type === 'search' && context.query) {
        const searchRes = await this.catalogService.search(context.query, 25, 0)
        const trackIdx = searchRes.tracks.items.findIndex(
          (t) => t.providerId === currentTrack.providerId,
        )
        if (trackIdx !== -1) {
          candidates.push(...searchRes.tracks.items.slice(trackIdx + 1))
        } else {
          candidates.push(...searchRes.tracks.items)
        }
      } else if (context?.type === 'artist' && context.id) {
        const artistTracks = await this.catalogService.getArtistTopTracks(context.id, 25, 0)
        const trackIdx = artistTracks.items.findIndex(
          (t) => t.providerId === currentTrack.providerId,
        )
        if (trackIdx !== -1) {
          candidates.push(...artistTracks.items.slice(trackIdx + 1))
        } else {
          candidates.push(...artistTracks.items)
        }
      } else if (context?.type === 'album' && context.id) {
        const album = await this.catalogService.getAlbum(context.id)
        if (album.tracks) {
          const trackIdx = album.tracks.findIndex((t) => t.providerId === currentTrack.providerId)
          if (trackIdx !== -1) {
            candidates.push(...album.tracks.slice(trackIdx + 1))
          } else {
            candidates.push(...album.tracks)
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch contextual candidates: ${(err as Error).message}`)
    }

    // Fallback: If not enough candidates from context, query current artist's top tracks
    if (
      candidates.filter((t) => !excludeIds.has(t.providerId)).length < 5 &&
      currentTrack.artist?.providerId
    ) {
      try {
        const artistTracks = await this.catalogService.getArtistTopTracks(
          currentTrack.artist.providerId,
          20,
          0,
        )
        candidates.push(...artistTracks.items)
      } catch (err) {
        this.logger.warn(`Failed to fetch artist top tracks fallback: ${(err as Error).message}`)
      }
    }

    // Second Fallback: Charts
    if (candidates.filter((t) => !excludeIds.has(t.providerId)).length < 5) {
      try {
        const charts = await this.catalogService.getCharts()
        candidates.push(...charts.tracks)
      } catch (err) {
        this.logger.warn(`Failed to fetch charts fallback: ${(err as Error).message}`)
      }
    }

    // Deduplicate against excludeIds and preserve only tracks with previewUrl
    const result: TrackSummary[] = []
    const seen = new Set(excludeIds)

    for (const track of candidates) {
      if (track.previewUrl && !seen.has(track.providerId)) {
        seen.add(track.providerId)
        result.push(track)
        if (result.length >= 25) break
      }
    }

    return result
  }
}
