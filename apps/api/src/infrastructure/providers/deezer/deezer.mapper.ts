
import type {
  AlbumDetails,
  AlbumSummary,
  ArtistDetails,
  ArtistSummary,
  ChartResult,
  Genre,
  ImageSet,
  Paginated,
  TrackDetails,
  TrackSummary,
} from '@music-app/shared-types'
import type {
  DeezerAlbumDto,
  DeezerArtistDto,
  DeezerChartDto,
  DeezerGenreDto,
  DeezerPaginatedResponse,
  DeezerTrackDto,
} from './deezer.types.js'

type DeezerImageSource = {
  cover_small?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
}

export class DeezerMapper {
  static toImageSet(source?: DeezerImageSource): ImageSet {
    return {
      small: source?.cover_small || source?.picture_small || null,
      medium: source?.cover_medium || source?.picture_medium || null,
      large: source?.cover_big || source?.picture_big || null,
      xl: source?.cover_xl || source?.picture_xl || null,
    }
  }

  static toTrackSummary(dto: DeezerTrackDto): TrackSummary {
    return {
      provider: 'deezer',
      providerId: String(dto.id),
      title: dto.title,
      titleVersion: dto.title_version || null,
      duration: dto.duration,
      previewUrl: dto.preview || null,
      explicit: dto.explicit_lyrics,
      artist: {
        provider: 'deezer',
        providerId: String(dto.artist.id),
        name: dto.artist.name,
      },
      album: {
        provider: 'deezer',
        providerId: String(dto.album?.id ?? ''),
        title: dto.album?.title || 'Unknown Album',
        cover: DeezerMapper.toImageSet(dto.album),
      },
    }
  }

  static toTrackDetails(dto: DeezerTrackDto): TrackDetails {
    return {
      ...DeezerMapper.toTrackSummary(dto),
      rank: dto.rank ?? null,
      bpm: dto.bpm ?? null,
      releaseDate: dto.release_date ?? null,
    }
  }

  static toArtistSummary(dto: DeezerArtistDto): ArtistSummary {
    return {
      provider: 'deezer',
      providerId: String(dto.id),
      name: dto.name,
      images: DeezerMapper.toImageSet(dto),
    }
  }

  static toArtistDetails(dto: DeezerArtistDto): ArtistDetails {
    return {
      ...DeezerMapper.toArtistSummary(dto),
      albumsCount: dto.nb_album ?? null,
      fansCount: dto.nb_fan ?? null,
    }
  }

  static toAlbumSummary(dto: DeezerAlbumDto): AlbumSummary {
    return {
      provider: 'deezer',
      providerId: String(dto.id),
      title: dto.title,
      artist: {
        provider: 'deezer',
        providerId: String(dto.artist?.id ?? ''),
        name: dto.artist?.name || 'Various Artists',
      },
      cover: DeezerMapper.toImageSet(dto),
      releaseDate: dto.release_date || null,
    }
  }

  static toAlbumDetails(dto: DeezerAlbumDto): AlbumDetails {
    return {
      ...DeezerMapper.toAlbumSummary(dto),
      tracksCount: dto.nb_tracks ?? null,
      duration: dto.duration ?? null,
      explicit: dto.explicit_lyrics ?? false,
      tracks: dto.tracks?.data?.map(DeezerMapper.toTrackSummary) ?? [],
    }
  }

  static toGenre(dto: DeezerGenreDto): Genre {
    return {
      provider: 'deezer',
      providerId: String(dto.id),
      name: dto.name,
      images: DeezerMapper.toImageSet(dto),
    }
  }

  static toChartResult(dto: DeezerChartDto): ChartResult {
    return {
      tracks: dto.tracks?.data?.map(DeezerMapper.toTrackSummary) ?? [],
      albums: dto.albums?.data?.map(DeezerMapper.toAlbumSummary) ?? [],
      artists: dto.artists?.data?.map(DeezerMapper.toArtistSummary) ?? [],
    }
  }

  static toPaginated<TIn, TOut>(
    response: DeezerPaginatedResponse<TIn>,
    limit: number,
    offset: number,
    transform: (item: TIn) => TOut,
  ): Paginated<TOut> {
    const total = response.total

    return {
      items: response.data?.map(transform) ?? [],
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
      },
    }
  }
}
