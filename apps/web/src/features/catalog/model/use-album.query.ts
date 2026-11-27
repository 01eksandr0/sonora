import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

export function useAlbum(id: Ref<string>) {
  const enabled = computed(() => id.value.length > 0)

  const albumQuery = useQuery({
    queryKey: computed(() => queryKeys.catalog.album(id.value)),
    queryFn: () => api.catalog.getAlbum(id.value),
    enabled,
  })

  return {
    albumQuery,
  }
}
