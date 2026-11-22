import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlayerService } from './player.service.js'
import type { TrackSummary } from '@music-app/shared-types'

describe('PlayerService', () => {
  let playerService: PlayerService
  let cacheService: any
  let catalogService: any
  let playerQueueService: any
  let prisma: any

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

  beforeEach(() => {
    cacheService = {
      get: vi.fn(),
      set: vi.fn(),
    }
    catalogService = {
      getFreshTrack: vi.fn().mockResolvedValue(mockTrack),
    }
    playerQueueService = {
      getUpcomingCandidates: vi.fn().mockResolvedValue([mockNextTrack]),
    }
    prisma = {
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
    }

    playerService = new PlayerService(
      cacheService,
      catalogService,
      playerQueueService,
      prisma,
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

    const excludeIds = playerQueueService.getUpcomingCandidates.mock.calls[0][2] as Set<string>
    expect([...excludeIds]).toEqual(['10'])
  })

  it('opens one history row on started and updates it on later events', async () => {
    cacheService.get.mockResolvedValue(null)

    await playerService.emitEvent('user-1', '100', 'started', 0)
    expect(prisma.listeningHistory.create).toHaveBeenCalledTimes(1)

    prisma.listeningHistory.findFirst.mockResolvedValue({ id: 'hist-1', listenedSeconds: 10, completed: false })
    await playerService.emitEvent('user-1', '100', 'completed', 30)

    expect(prisma.listeningHistory.create).toHaveBeenCalledTimes(1)
    expect(prisma.listeningHistory.update).toHaveBeenCalledWith({
      where: { id: 'hist-1' },
      data: { listenedSeconds: 30, completed: true },
    })
  })
})
