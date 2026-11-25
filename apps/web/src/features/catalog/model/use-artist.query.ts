import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

export function useArtist(id: Ref<string>) {
  const enabled = computed(() => id.value.length > 0)

  const artistQuery = useQuery({
    queryKey: computed(() => queryKeys.catalog.artist(id.value)),
    queryFn: () => api.catalog.getArtist(id.value),
    enabled,
  })

  const topTracksQuery = useQuery({
    queryKey: computed(() => queryKeys.catalog.artistTopTracks(id.value, 10, 0)),
    queryFn: () => api.catalog.getArtistTopTracks(id.value, { limit: 10, offset: 0 }),
    enabled,
  })

  const albumsQuery = useQuery({
    queryKey: computed(() => queryKeys.catalog.artistAlbums(id.value, 25, 0)),
    queryFn: () => api.catalog.getArtistAlbums(id.value, { limit: 25, offset: 0 }),
    enabled,
  })

  return {
    artistQuery,
    topTracksQuery,
    albumsQuery,
  }
}
