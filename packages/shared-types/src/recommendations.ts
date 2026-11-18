import type { TrackSummary } from './catalog.js'

export interface RecommendationCollectionResponse {
  tracks: TrackSummary[]
  refreshedAt: string | null
  nextRefreshAt: string | null
}