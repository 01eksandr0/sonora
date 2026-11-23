import type { TrackSummary } from './catalog.js'

export interface PlayerContext {
  type: 'search' | 'artist' | 'album' | 'playlist' | 'collection'
  id?: string
  query?: string
}

export interface PlayerState {
  userId: string
  currentTrack: TrackSummary | null
  isPlaying: boolean
  progressMs: number
  volume: number
  updatedAt: number
  history: TrackSummary[]
  queue: TrackSummary[]
  context?: PlayerContext
  isLiked?: boolean
}

export interface PlayTrackRequest {
  trackId: string
  context?: PlayerContext
}

export interface SeekTrackRequest {
  positionSec: number
}

export interface PlayerEventRequest {
  trackId: string
  event: 'started' | 'listened_10s' | 'completed' | 'skipped'
  durationSec: number
  /** Returned by the 'started' event; required for every other event of the same listen. */
  playbackId?: string
}

export interface PlayerEventResponse {
  success: boolean
  playbackId: string
}
