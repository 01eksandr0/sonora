import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { RecommendationCollectionResponse } from '@music-app/shared-types'
import { Prisma } from '../../generated/prisma/browser.js'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { CatalogService } from '../catalog/catalog.service.js'
import { trackCollectionSchema } from './track-summary.schema.js'

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
  ) {}

  async getCollection(userId: string): Promise<RecommendationCollectionResponse> {
    const profile = await this.prisma.tasteProfile.findUnique({
      where: { userId },
      include: { artists: true },
    })

    if (!profile || profile.artists.length === 0) {
      return {
        tracks: [],
        refreshedAt: null,
        nextRefreshAt: null,
      }
    }

    const now = new Date()

    const existingCollection = await this.prisma.recommendationCollection.findUnique({
      where: { userId },
    })

    if (existingCollection?.nextRefreshAt && existingCollection.nextRefreshAt > now) {
      const parsedTracks = trackCollectionSchema.safeParse(existingCollection.tracks)

      if (parsedTracks.success) {
        return {
          tracks: parsedTracks.data,
          refreshedAt: existingCollection.refreshedAt?.toISOString() ?? null,
          nextRefreshAt: existingCollection.nextRefreshAt.toISOString(),
        }
      }
    }

    const refreshToken = randomUUID()
    const refreshLockUntil = new Date(now.getTime() + 60_000)

    const claim = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtext(${userId}))::text
      `

      const collection = await tx.recommendationCollection.findUnique({
        where: { userId },
      })

      if (collection?.nextRefreshAt && collection.nextRefreshAt > new Date()) {
        const parsedTracks = trackCollectionSchema.safeParse(collection.tracks)

        if (parsedTracks.success) {
          return {
            type: 'cached' as const,
            response: {
              tracks: parsedTracks.data,
              refreshedAt: collection.refreshedAt?.toISOString() ?? null,
              nextRefreshAt: collection.nextRefreshAt.toISOString(),
            },
          }
        }
      }

      if (collection?.refreshLockUntil && collection.refreshLockUntil > new Date()) {
        return { type: 'locked' as const }
      }

      await tx.recommendationCollection.upsert({
        where: { userId },
        create: {
          userId,
          tracks: [],
          refreshToken,
          refreshLockUntil,
        },
        update: {
          refreshToken,
          refreshLockUntil,
        },
      })

      return { type: 'claimed' as const }
    })

    if (claim.type === 'cached') {
      return claim.response
    }

    if (claim.type === 'locked') {
      throw new HttpException(
        {
          message: 'Recommendation collection is being refreshed',
        },
        HttpStatus.ACCEPTED,
      )
    }

    try {
      const preferredArtists = profile.artists.map((artist) => artist.artistName)

      const matchedArtists = await Promise.all(
        preferredArtists.map(async (artistName) => {
          const result = await this.catalogService.search(artistName, 25, 0)

          const matches = result.artists.items.filter(
            (artist) => artist.name.trim().toLowerCase() === artistName.trim().toLowerCase(),
          )

          const uniqueIds = new Set(matches.map((artist) => artist.providerId))

          if (uniqueIds.size !== 1 || !matches[0]) {
            return null
          }

          return matches[0]
        }),
      )

      const artists = matchedArtists.filter((artist) => artist !== null)

      const tracksByArtist = await Promise.all(
        artists.map(async (artist) => {
          const result = await this.catalogService.getArtistTopTracks(artist.providerId, 25, 0)

          return result.items
        }),
      )

      const tracks: (typeof tracksByArtist)[number][number][] = []
      const seenTracks = new Set<string>()

      for (let index = 0; tracks.length < 50; index += 1) {
        let foundTrack = false

        for (const artistTracks of tracksByArtist) {
          const track = artistTracks[index]

          if (!track) continue

          foundTrack = true

          const key = `${track.provider}:${track.providerId}`

          if (seenTracks.has(key)) continue

          seenTracks.add(key)
          tracks.push(track)

          if (tracks.length === 50) break
        }

        if (!foundTrack) break
      }

      const refreshedAt = new Date()
      const nextRefreshAt = new Date(refreshedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

      const saved = await this.prisma.recommendationCollection.updateMany({
        where: {
          userId,
          refreshToken,
          refreshLockUntil: {
            gt: new Date(),
          },
        },
        data: {
          tracks: tracks as unknown as Prisma.InputJsonValue,
          refreshedAt,
          nextRefreshAt,
          refreshToken: null,
          refreshLockUntil: null,
        },
      })

      if (saved.count === 0) {
        throw new HttpException(
          'Recommendation refresh lock expired',
          HttpStatus.SERVICE_UNAVAILABLE,
        )
      }

      return {
        tracks,
        refreshedAt: refreshedAt.toISOString(),
        nextRefreshAt: nextRefreshAt.toISOString(),
      }
    } catch (error) {
      await this.prisma.recommendationCollection.updateMany({
        where: {
          userId,
          refreshToken,
        },
        data: {
          refreshToken: null,
          refreshLockUntil: null,
        },
      })

      const staleCollection = await this.prisma.recommendationCollection.findUnique({
        where: { userId },
      })

      if (staleCollection) {
        const parsedTracks = trackCollectionSchema.safeParse(staleCollection.tracks)

        if (parsedTracks.success && staleCollection.refreshedAt) {
          return {
            tracks: parsedTracks.data,
            refreshedAt: staleCollection.refreshedAt.toISOString(),
            nextRefreshAt: staleCollection.nextRefreshAt?.toISOString() ?? null,
          }
        }
      }

      throw error
    }
  }
}
