<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'
import { RecommendationSection } from '@/widgets/recommendation-section'

const collection = useQuery({
  queryKey: queryKeys.recommendations.collection,
  queryFn: () => api.recommendations.getCollection(),
  retry: false,
  refetchInterval: (query) => {
    const data = query.state.data
    return data && 'status' in data && data.status === 'refreshing' ? data.retryAfter * 1000 : false
  },
})

const tracks = computed(() => {
  const data = collection.data.value
  return data && 'tracks' in data ? data.tracks : []
})

const isRefreshing = computed(() => {
  const data = collection.data.value
  return Boolean(data && 'status' in data && data.status === 'refreshing')
})
</script>

<template>
  <main class="home">
    <header class="welcome">
      <p class="eyebrow">YOUR MUSIC, YOUR WAY</p>
      <h1>Made for the way <span>you listen.</span></h1>
    </header>

    <RecommendationSection
      :tracks="tracks"
      :loading="collection.isPending.value"
      :refreshing="isRefreshing"
      :error="collection.isError.value"
      @retry="collection.refetch()"
    />
  </main>
</template>

<style scoped>
.home {
  color: var(--sonora-text);
  margin: 0 auto;
  max-width: 1240px;
  padding: 28px 5vw 60px;
}

.welcome {
  margin-bottom: 36px;
}

.eyebrow {
  color: var(--sonora-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 0 10px;
}

h1 {
  font-size: clamp(30px, 5vw, 48px);
  letter-spacing: -0.06em;
  margin: 0;
}

h1 span {
  color: var(--sonora-accent);
}
</style>
