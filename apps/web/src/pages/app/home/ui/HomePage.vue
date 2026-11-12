<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { IconMusic } from '@tabler/icons-vue'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

const collection = useQuery({
  queryKey: queryKeys.recommendations.collection,
  queryFn: () => api.recommendations.getCollection(),
  retry: false,
  refetchInterval: (query) => {
    const data = query.state.data
    return data && 'status' in data && data.status === 'refreshing' ? 5000 : false
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

    <section class="collection">
      <div class="collection-heading">
        <div>
          <p class="eyebrow">UPDATED EVERY WEEK</p>
          <h2>This week for you</h2>
        </div>
        <span v-if="tracks.length">{{ tracks.length }} songs</span>
      </div>

      <p v-if="collection.isPending.value || isRefreshing" class="message">
        Finding songs from your favorite artists…
      </p>
      <div v-else-if="collection.isError.value" class="message" role="alert">
        <p>Couldn't load your collection.</p>
        <button type="button" @click="collection.refetch()">Try again</button>
      </div>
      <p v-else-if="!tracks.length" class="message">
        <IconMusic :size="20" />
        Your collection will appear here when it's ready.
      </p>

      <div v-else class="track-list">
        <div v-for="(track, index) in tracks" :key="track.providerId" class="track">
          <span class="track-number">{{ index + 1 }}</span>
          <img
            v-if="track.album.cover.small"
            class="cover"
            :src="track.album.cover.small"
            :alt="`${track.album.title} cover`"
          />
          <div v-else class="cover cover-empty"><IconMusic :size="18" /></div>
          <div class="track-name">
            <strong>{{ track.title }}</strong>
            <span>{{ track.artist.name }}</span>
          </div>
          <span class="album">{{ track.album.title }}</span>
        </div>
      </div>
    </section>
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

.collection-heading {
  align-items: end;
  border-bottom: 1px solid #292930;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 16px;
}

.collection-heading h2 {
  font-size: 20px;
  margin: 0;
}

.collection-heading > span,
.album,
.track-number {
  color: var(--sonora-muted);
  font-size: 12px;
}

.message {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  gap: 10px;
  justify-content: center;
  min-height: 180px;
  text-align: center;
}

.message button {
  background: none;
  border: 0;
  color: var(--sonora-accent);
  cursor: pointer;
}

.track {
  align-items: center;
  border-bottom: 1px solid #202027;
  display: grid;
  gap: 14px;
  grid-template-columns: 24px 44px minmax(0, 1fr) minmax(100px, 0.8fr);
  padding: 9px 4px;
}

.track:hover {
  background: #15151b;
}

.track-number {
  text-align: center;
}

.cover {
  border-radius: 4px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.cover-empty {
  align-items: center;
  background: var(--sonora-card);
  color: var(--sonora-muted);
  display: flex;
  justify-content: center;
}

.track-name {
  min-width: 0;
}

.track-name strong,
.track-name span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-name strong {
  font-size: 13px;
}

.track-name span {
  color: var(--sonora-muted);
  font-size: 11px;
  margin-top: 4px;
}

.album {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .home {
    padding: 24px 20px 36px;
  }

  .track {
    gap: 10px;
    grid-template-columns: 20px 40px minmax(0, 1fr);
  }

  .cover {
    height: 40px;
    width: 40px;
  }

  .album {
    display: none;
  }
}
</style>
