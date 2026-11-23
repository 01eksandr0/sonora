import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import type { TrackSummary } from '@music-app/shared-types'
import type { CacheService } from '../../infrastructure/cache/cache.service.js'
import type { PrismaService } from '../../infrastructure/database/prisma.service.js'
import type { CatalogService } from '../catalog/catalog.service.js'
import type { PlayerQueueService } from './player-queue.service.js'
import { PlayerService } from './player.service.js'

describe('PlayerService', () => {
  let playerService: PlayerService

  const mockTrack: TrackSummary = {
    provider: 'deezer',
    providerId: '100',
    title: 'Test Song',
    titleVersion: null,
    duration: 30,
    previewUrl: 'https://example.com/audio.mp3',
    explicit: false,
    artist: { provider: 'deezer', providerId: '200', name: 'Test Artist' },
    album: {
      provider: 'deezer',
      providerId: '300',
      title: 'Test Album',
      cover: { small: 'small.jpg', medium: 'medium.jpg', large: 'big.jpg', xl: 'xl.jpg' },
    },
  }

  const mockNextTrack: TrackSummary = {
    ...mockTrack,
    providerId: '101',
    title: 'Next Song',
  }

  // Only the members PlayerService touches; cast to the real types once, at construction.
  const createMocks = () => ({
    cacheService: {
      get: vi.fn(),
      set: vi.fn(),
    },
    catalogService: {
      getFreshTrack: vi.fn().mockResolvedValue(mockTrack),
    },
    playerQueueService: {
      getUpcomingCandidates: vi.fn().mockResolvedValue([mockNextTrack]),
    },
    prisma: {
      favoriteTrack: {
        count: vi.fn().mockResolvedValue(0),
      },
      listeningHistory: {
        create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: 'hist-1' }),
      },
      recommendationCollection: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    },
  })

  let cacheService: ReturnType<typeof createMocks>['cacheService']
  let catalogService: ReturnType<typeof createMocks>['catalogService']
  let playerQueueService: ReturnType<typeof createMocks>['playerQueueService']
  let prisma: ReturnType<typeof createMocks>['prisma']

  beforeEach(() => {
    ;({ cacheService, catalogService, playerQueueService, prisma } = createMocks())

    playerService = new PlayerService(
      cacheService as unknown as CacheService,
      catalogService as unknown as CatalogService,
      playerQueueService as unknown as PlayerQueueService,
      prisma as unknown as PrismaService,
    )
  })

  it('returns default empty session state if no session in cache', async () => {
    cacheService.get.mockResolvedValue(null)
    const state = await playerService.getState('user-1')

    expect(state.userId).toBe('user-1')
    expect(state.currentTrack).toBeNull()
    expect(state.isPlaying).toBe(false)
    expect(state.queue).toEqual([])
    expect(state.history).toEqual([])
  })

  it('starts playback of a track and populates upcoming queue', async () => {
    cacheService.get.mockResolvedValue(null)

    const state = await playerService.play('user-1', '100', { type: 'search', query: 'test' })

    expect(catalogService.getFreshTrack).toHaveBeenCalledWith('100')
    expect(playerQueueService.getUpcomingCandidates).toHaveBeenCalled()
    expect(state.currentTrack?.providerId).toBe('100')
    expect(state.isPlaying).toBe(true)
    expect(state.queue).toHaveLength(1)
    expect(cacheService.set).toHaveBeenCalled()
  })

  it('switches to next track in queue and pushes current to history', async () => {
    playerQueueService.getUpcomingCandidates.mockResolvedValue([])

    cacheService.get.mockResolvedValue({
      userId: 'user-1',
      currentTrack: mockTrack,
      isPlaying: true,
      progressMs: 5000,
      volume: 70,
      updatedAt: Date.now(),
      history: [],
      queue: [mockNextTrack],
    })

    catalogService.getFreshTrack.mockResolvedValue({ ...mockNextTrack, previewUrl: 'https://fresh' })

    const state = await playerService.next('user-1')

    expect(state.currentTrack?.providerId).toBe('101')
    expect(state.currentTrack?.previewUrl).toBe('https://fresh')
    expect(state.history).toHaveLength(1)
    expect(state.history[0]?.providerId).toBe('100')
    expect(state.queue).toHaveLength(0)
  })

  it('restarts track on previous if played more than 3 seconds', async () => {
    cacheService.get.mockResolvedValue({
      userId: 'user-1',
      currentTrack: mockTrack,
      isPlaying: true,
      progressMs: 4000,
      volume: 70,
      updatedAt: Date.now(),
      history: [mockNextTrack],
      queue: [],
    })

    const state = await playerService.previous('user-1')

    expect(state.currentTrack?.providerId).toBe('100')
    expect(state.progressMs).toBe(0)
    expect(state.history).toHaveLength(1)
  })

  it('goes back to previous track in history if played <= 3 seconds', async () => {
    cacheService.get.mockResolvedValue({
      userId: 'user-1',
      currentTrack: mockTrack,
      isPlaying: true,
      progressMs: 1000,
      volume: 70,
      updatedAt: Date.now(),
      history: [mockNextTrack],
      queue: [],
    })

    const state = await playerService.previous('user-1')

    expect(state.currentTrack?.providerId).toBe('101')
    expect(state.queue).toHaveLength(1)
    expect(state.queue[0]?.providerId).toBe('100')
    expect(state.history).toHaveLength(0)
  })

  it('populates history and queue correctly when playing from a collection context', async () => {
    const trackA = { ...mockTrack, providerId: '10' }
    const trackB = { ...mockTrack, providerId: '20' }
    const trackC = { ...mockTrack, providerId: '30' }

    prisma.recommendationCollection.findUnique.mockResolvedValue({
      userId: 'user-1',
      tracks: [trackA, trackB, trackC],
    })
    catalogService.getFreshTrack.mockResolvedValue(trackB)
    cacheService.get.mockResolvedValue(null)
    playerQueueService.getUpcomingCandidates.mockResolvedValue([trackC])

    const state = await playerService.play('user-1', '20', { type: 'collection' })

    expect(state.currentTrack?.providerId).toBe('20')
    expect(state.history).toHaveLength(1)
    expect(state.history[0]?.providerId).toBe('10')
    expect(playerQueueService.getUpcomingCandidates).toHaveBeenCalledWith(
      trackB,
      { type: 'collection' },
      expect.any(Set),
      'user-1',
    )
  })

  it('keeps collection order even if its tracks are already in history', async () => {
    const trackA = { ...mockTrack, providerId: '10' }
    const trackB = { ...mockTrack, providerId: '20' }
    cacheService.get.mockResolvedValue({
      userId: 'user-1',
      currentTrack: trackB,
      isPlaying: true,
      progressMs: 0,
      volume: 70,
      updatedAt: Date.now(),
      history: [trackA],
      queue: [],
    })
    catalogService.getFreshTrack.mockResolvedValue(trackA)

    await playerService.play('user-1', '10', { type: 'collection' })

    const excludeIds = playerQueueService.getUpcomingCandidates.mock.calls[0]?.[2] as Set<string>
    expect([...excludeIds]).toEqual(['10'])
  })

  it('opens a history row on started and updates exactly that row by playbackId', async () => {
    cacheService.get.mockResolvedValue(null)

    const { playbackId } = await playerService.emitEvent('user-1', '100', 'started', 0)
    expect(playbackId).toBe('hist-1')

    prisma.listeningHistory.findFirst.mockResolvedValue({ id: 'hist-1', listenedSeconds: 10, completed: false })
    await playerService.emitEvent('user-1', '100', 'completed', 30, playbackId)

    expect(prisma.listeningHistory.findFirst).toHaveBeenCalledWith({
      where: { id: 'hist-1', userId: 'user-1', providerId: '100' },
    })
    expect(prisma.listeningHistory.create).toHaveBeenCalledTimes(1)
    expect(prisma.listeningHistory.update).toHaveBeenCalledWith({
      where: { id: 'hist-1' },
      data: { listenedSeconds: 30, completed: true },
    })
  })

  it('rejects follow-up events for an unknown playback', async () => {
    await expect(playerService.emitEvent('user-1', '100', 'skipped', 5, 'foreign-id')).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(prisma.listeningHistory.update).not.toHaveBeenCalled()
  })

  it('keeps zero volume when a new track is played', async () => {
    cacheService.get.mockResolvedValue({
      userId: 'user-1',
      currentTrack: null,
      isPlaying: false,
      progressMs: 0,
      volume: 0,
      updatedAt: Date.now(),
      history: [],
      queue: [],
    })

    const state = await playerService.play('user-1', '100')

    expect(state.volume).toBe(0)
  })
})
