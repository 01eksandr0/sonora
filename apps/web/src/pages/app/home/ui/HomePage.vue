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
    <section class="home-hero">
      <div>
        <p class="eyebrow">CURATED FOR YOU</p>
        <h1>Find your<br /><span>next favorite.</span></h1>
        <p class="hero-copy">A handpicked mix from the edges of your taste.
        </p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <span />
        <span />
      </div>
    </section>

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

.home-hero {
  align-items: center;
  background: #1a2020;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 42px;
  min-height: 250px;
  overflow: hidden;
  padding: 32px 40px;
  position: relative;
}

.eyebrow {
  color: var(--sonora-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 0 10px;
}

h1 {
  font-size: clamp(38px, 5vw, 64px);
  letter-spacing: -0.075em;
  line-height: 0.95;
  margin: 16px 0;
}

h1 span {
  color: var(--sonora-accent);
}

.hero-copy {
  color: var(--sonora-muted);
  font-size: 12px;
  margin: 0;
}

.hero-art {
  background: #314a3a;
  border-radius: 50%;
  height: 210px;
  margin-right: 4%;
  position: relative;
  width: 210px;
}

.hero-art::before,
.hero-art span {
  border: 1px solid rgb(242 241 237 / 45%);
  border-radius: 50%;
  content: '';
  inset: 12%;
  position: absolute;
}

.hero-art span:first-child {
  background: var(--sonora-accent);
  border: 0;
  inset: 31%;
}

.hero-art span:last-child {
  inset: 22%;
}

@media (max-width: 640px) {
  .home {
    padding: 24px 20px 36px;
  }

  .home-hero {
    min-height: 230px;
    padding: 26px;
  }

  .hero-art {
    height: 120px;
    margin-right: -70px;
    width: 120px;
  }
}
</style>
