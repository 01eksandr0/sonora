import { Injectable, NotFoundException } from '@nestjs/common'
import type { FavoriteStatusResponse, FavoriteTrackSummary, Paginated } from '@music-app/shared-types'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { CatalogService } from '../catalog/catalog.service.js'

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
  ) {}

  async addFavoriteTrack(userId: string, trackId: string): Promise<boolean> {
    const track = await this.catalogService.getTrack(trackId)
    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`)
    }

    await this.prisma.favoriteTrack.upsert({
      where: {
        userId_provider_providerId: {
          userId,
          provider: 'DEEZER',
          providerId: trackId,
        },
      },
      create: {
        userId,
        provider: 'DEEZER',
        providerId: trackId,
        title: track.title,
        artistName: track.artist.name,
        albumTitle: track.album.title,
        coverUrl: track.album.cover.small || null,
        duration: track.duration,
        // Signed Deezer preview URLs expire in ~15 min; playback fetches a fresh one via the player.
        previewUrl: null,
      },
      update: {},
    })

    return true
  }

  async removeFavoriteTrack(userId: string, trackId: string): Promise<boolean> {
    await this.prisma.favoriteTrack.deleteMany({
      where: {
        userId,
        provider: 'DEEZER',
        providerId: trackId,
      },
    })
    return true
  }

  async getFavoriteStatus(userId: string, trackIds: string[]): Promise<FavoriteStatusResponse> {
    if (!trackIds.length) return {}

    const favorites = await this.prisma.favoriteTrack.findMany({
      where: {
        userId,
        provider: 'DEEZER',
        providerId: { in: trackIds },
      },
      select: { providerId: true },
    })

    const statusMap: FavoriteStatusResponse = {}
    for (const id of trackIds) {
      statusMap[id] = false
    }
    for (const fav of favorites) {
      statusMap[fav.providerId] = true
    }

    return statusMap
  }

  async getFavorites(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<Paginated<FavoriteTrackSummary>> {
    const [items, total] = await Promise.all([
      this.prisma.favoriteTrack.findMany({
        where: { userId, provider: 'DEEZER' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.favoriteTrack.count({
        where: { userId, provider: 'DEEZER' },
      }),
    ])

    return {
      items: items.map((item) => ({
        id: item.id,
        provider: 'deezer',
        providerId: item.providerId,
        title: item.title,
        artistName: item.artistName,
        albumTitle: item.albumTitle,
        coverUrl: item.coverUrl,
        duration: item.duration,
        createdAt: item.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + items.length < total,
      },
    }
  }
}
