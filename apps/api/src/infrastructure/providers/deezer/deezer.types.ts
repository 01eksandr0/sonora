
export interface DeezerPaginatedResponse<T> {
  data: T[]
  total: number
  next?: string
  prev?: string
}

export interface DeezerErrorResponse {
  error: {
    type: string
    message: string
    code: number
  }
}

export interface DeezerImageDto {
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
  cover_small?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
}

export interface DeezerArtistDto extends DeezerImageDto {
  id: number
  name: string
  nb_album?: number
  nb_fan?: number
}

export interface DeezerAlbumDto extends DeezerImageDto {
  id: number
  title: string
  release_date?: string
  record_type?: string
  nb_tracks?: number
  duration?: number
  explicit_lyrics?: boolean
  artist?: {
    id: number
    name: string
  }
  tracks?: DeezerPaginatedResponse<DeezerTrackDto>
}

export interface DeezerTrackDto {
  id: number
  title: string
  title_version?: string
  duration: number
  preview: string | null
  explicit_lyrics: boolean
  rank?: number
  bpm?: number
  release_date?: string
  artist: {
    id: number
    name: string
    picture_medium?: string
  }
  album?: {
    id: number
    title: string
    cover_medium?: string
    cover_big?: string
  }
}

export interface DeezerGenreDto extends DeezerImageDto {
  id: number
  name: string
}

export interface DeezerChartDto {
  tracks: DeezerPaginatedResponse<DeezerTrackDto>
  albums: DeezerPaginatedResponse<DeezerAlbumDto>
  artists: DeezerPaginatedResponse<DeezerArtistDto>
}
