export const queryKeys = {
  health: ['health'] as const,
  currentUser: ['current-user'] as const,
  catalog: {
    search: (query: string, limit: number, offset: number) =>
      ['catalog', 'search', query, limit, offset] as const,

    artist: (id: string) => ['catalog', 'artist', id] as const,

    album: (id: string) => ['catalog', 'album', id] as const,

    artistTopTracks: (id: string, limit: number, offset: number) =>
      ['catalog', 'artist', id, 'top-tracks', limit, offset] as const,

    artistAlbums: (id: string, limit: number, offset: number) =>
      ['catalog', 'artist', id, 'albums', limit, offset] as const,
  },
  recommendations: {
    collection: ['recommendations', 'collection'] as const,
  },
} as const
