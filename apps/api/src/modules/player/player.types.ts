import type { TrackSummary, PlayerContext } from '@music-app/shared-types'

export interface PlayerSessionState {
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
