import { Injectable, NotFoundException } from '@nestjs/common'
import type { TrackSummary, PlayerContext } from '@music-app/shared-types'
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { CatalogService } from '../catalog/catalog.service.js'
import { PlayerQueueService } from './player-queue.service.js'
import type { PlayerSessionState } from './player.types.js'

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
// Contexts with a fixed track order: their queue must follow that order even if tracks were heard earlier.
const ORDERED_CONTEXTS = new Set<PlayerContext['type']>(['collection', 'album', 'playlist'])

@Injectable()
export class PlayerService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly catalogService: CatalogService,
    private readonly playerQueueService: PlayerQueueService,
    private readonly prisma: PrismaService,
  ) {}

  private getSessionKey(userId: string): string {
    return `player:session:${userId}`
  }

  async getState(userId: string): Promise<PlayerSessionState> {
    const key = this.getSessionKey(userId)
    const session = await this.cacheService.get<PlayerSessionState>(key)

    if (session) {
      if (session.currentTrack) {
        session.isLiked = await this.checkIsLiked(userId, session.currentTrack.providerId)
      }
      return session
    }

    return {
      userId,
      currentTrack: null,
      isPlaying: false,
      progressMs: 0,
      volume: 70,
      updatedAt: Date.now(),
      history: [],
      queue: [],
      isLiked: false,
    }
  }

  async play(userId: string, trackId: string, context?: PlayerContext): Promise<PlayerSessionState> {
    const track = await this.catalogService.getFreshTrack(trackId)
    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`)
    }

    const currentState = await this.getState(userId)
    const history = [...currentState.history]

    if (currentState.currentTrack && currentState.currentTrack.providerId !== track.providerId) {
      history.unshift(currentState.currentTrack)
      if (history.length > 50) history.pop()
    }

    // If context is collection, populate preceding collection tracks into history
    if (context?.type === 'collection') {
      try {
        const collection = await this.prisma.recommendationCollection.findUnique({
          where: { userId },
        })
        if (collection && Array.isArray(collection.tracks)) {
          const collectionTracks = collection.tracks as unknown as TrackSummary[]
          const trackIdx = collectionTracks.findIndex((t) => t.providerId === track.providerId)
          if (trackIdx > 0) {
            const previousCollectionTracks = collectionTracks.slice(0, trackIdx).filter((t) => !!t.previewUrl)
            history.unshift(...previousCollectionTracks.reverse())
            if (history.length > 50) {
              history.length = 50
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const excludeIds = this.buildExcludeIds(track, history, [], context)

    const upcoming = await this.playerQueueService.getUpcomingCandidates(track, context, excludeIds, userId)
    const isLiked = await this.checkIsLiked(userId, track.providerId)

    const newState: PlayerSessionState = {
      userId,
      currentTrack: track,
      isPlaying: true,
      progressMs: 0,
      volume: currentState.volume || 70,
      updatedAt: Date.now(),
      history,
      queue: upcoming,
      context,
      isLiked,
    }

    await this.saveSession(newState)
    return newState
  }

  async pause(userId: string): Promise<PlayerSessionState> {
    const state = await this.getState(userId)
    state.isPlaying = false
    state.updatedAt = Date.now()
    await this.saveSession(state)
    return state
  }

  async resume(userId: string): Promise<PlayerSessionState> {
    const state = await this.getState(userId)
    if (state.currentTrack) {
      state.isPlaying = true
      state.updatedAt = Date.now()
      await this.saveSession(state)
    }
    return state
  }

  async next(userId: string): Promise<PlayerSessionState> {
    const state = await this.getState(userId)
    const current = state.currentTrack

    if (current) {
      state.history.unshift(current)
      if (state.history.length > 50) state.history.pop()
    }

    // If queue is empty or low, replenish
    if (state.queue.length <= 2 && current) {
      const excludeIds = this.buildExcludeIds(current, state.history, state.queue, state.context)
      const candidates = await this.playerQueueService.getUpcomingCandidates(
        current,
        state.context,
        excludeIds,
        userId,
      )
      state.queue.push(...candidates)
    }

    const queued = state.queue.shift()
    const nextTrack = queued ? await this.withFreshPreview(queued) : null
    state.currentTrack = nextTrack
    state.isPlaying = !!nextTrack
    state.progressMs = 0
    state.updatedAt = Date.now()
    state.isLiked = nextTrack ? await this.checkIsLiked(userId, nextTrack.providerId) : false

    await this.saveSession(state)
    return state
  }

  async previous(userId: string): Promise<PlayerSessionState> {
    const state = await this.getState(userId)

    // UX standard: if played more than 3 seconds, restart current track
    if (state.progressMs > 3000 || state.history.length === 0) {
      state.progressMs = 0
      state.isPlaying = !!state.currentTrack
      state.updatedAt = Date.now()
      await this.saveSession(state)
      return state
    }

    // Pop from history
    const prevTrack = await this.withFreshPreview(state.history.shift()!)
    if (state.currentTrack) {
      state.queue.unshift(state.currentTrack)
    }

    state.currentTrack = prevTrack
    state.progressMs = 0
    state.isPlaying = true
    state.updatedAt = Date.now()
    state.isLiked = await this.checkIsLiked(userId, prevTrack.providerId)

    await this.saveSession(state)
    return state
  }

  async seek(userId: string, positionSec: number): Promise<PlayerSessionState> {
    const state = await this.getState(userId)
    state.progressMs = Math.max(0, positionSec * 1000)
    state.updatedAt = Date.now()
    await this.saveSession(state)
    return state
  }

  async emitEvent(
    userId: string,
    trackId: string,
    event: 'started' | 'listened_10s' | 'completed' | 'skipped',
    durationSec: number,
  ): Promise<void> {
    // One row per listen: 'started' opens it, later events update the latest row for that track.
    if (event !== 'started') {
      const listen = await this.prisma.listeningHistory.findFirst({
        where: { userId, provider: 'DEEZER', providerId: trackId },
        orderBy: { startedAt: 'desc' },
      })
      if (listen) {
        await this.prisma.listeningHistory.update({
          where: { id: listen.id },
          data: {
            listenedSeconds: Math.max(listen.listenedSeconds, durationSec),
            completed: listen.completed || event === 'completed',
          },
        })
        return
      }
    }

    const state = await this.getState(userId)
    const track = state.currentTrack?.providerId === trackId ? state.currentTrack : null

    await this.prisma.listeningHistory.create({
      data: {
        userId,
        provider: 'DEEZER',
        providerId: trackId,
        trackTitle: track?.title || 'Unknown Track',
        artistName: track?.artist.name || 'Unknown Artist',
        albumTitle: track?.album.title || null,
        coverUrl: track?.album.cover.small || null,
        listenedSeconds: durationSec,
        completed: event === 'completed',
      },
    })
  }

  private buildExcludeIds(
    current: TrackSummary,
    history: TrackSummary[],
    queue: TrackSummary[],
    context?: PlayerContext,
  ): Set<string> {
    const ids = [current, ...queue]
    if (!context || !ORDERED_CONTEXTS.has(context.type)) ids.push(...history)
    return new Set(ids.map((t) => t.providerId))
  }

  // Queue/history tracks sit in Redis/DB far longer than their signed preview URL lives.
  private async withFreshPreview(track: TrackSummary): Promise<TrackSummary> {
    try {
      const fresh = await this.catalogService.getFreshTrack(track.providerId)
      return { ...track, previewUrl: fresh.previewUrl ?? track.previewUrl }
    } catch {
      return track
    }
  }

  private async checkIsLiked(userId: string, providerId: string): Promise<boolean> {
    const count = await this.prisma.favoriteTrack.count({
      where: {
        userId,
        provider: 'DEEZER',
        providerId,
      },
    })
    return count > 0
  }

  private async saveSession(state: PlayerSessionState): Promise<void> {
    const key = this.getSessionKey(state.userId)
    await this.cacheService.set(key, state, SESSION_TTL_SECONDS)
  }
}
