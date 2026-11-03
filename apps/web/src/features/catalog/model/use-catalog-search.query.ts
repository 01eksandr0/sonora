import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

export function useCatalogSearch(
    query: Ref<string>,
    limit = 25,
    offset = 0,
) {
    const normalizedQuery = computed(() => query.value.trim())

    return useQuery({
        queryKey: computed(() =>
            queryKeys.catalog.search(normalizedQuery.value, limit, offset),
        ),
        queryFn: () =>
            api.catalog.search({
                q: normalizedQuery.value,
                limit,
                offset,
            }),
        enabled: computed(() => normalizedQuery.value.length >= 2),
    })
}