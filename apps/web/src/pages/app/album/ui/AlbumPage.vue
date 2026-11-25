<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { TrackSummary } from '@music-app/shared-types'
import { TrackRow } from '@/entities/track'
import { useAlbum } from '@/features/catalog/model/use-album.query'
import { usePlayerStore } from '@/features/player'

const route = useRoute()
const playerStore = usePlayerStore()

const albumId = computed(() => String(route.params.id ?? ''))

const { albumQuery } = useAlbum(albumId)

const album = computed(() => albumQuery.data.value)
const isPending = computed(() => albumQuery.isPending.value)
const isError = computed(() => albumQuery.isError.value)

function onPlayTrack(track: TrackSummary) {
  playerStore.playTrack(track, { type: 'album', id: albumId.value })
}
</script>

<template>
  <div class="content-wrap section-page">
    <section class="album-hero">
      <img
        v-if="album?.cover.large"
        :src="album.cover.large"
        :alt="`${album.title} cover`"
        class="album-cover"
      />

      <div class="album-info">
        <p class="eyebrow accent-text">Album</p>
        <h1 v-if="album">{{ album.title }}</h1>
        <p v-else-if="isPending">Loading album...</p>
        <p v-else-if="isError">Failed to load album.</p>

        <p v-if="album?.artist">
          {{ album.artist.name }}
        </p>

        <p v-if="album?.releaseDate">
          {{ album.releaseDate.slice(0, 4) }}
        </p>

        <p v-if="album?.tracksCount">{{ album.tracksCount }} tracks</p>
      </div>
    </section>

    <section class="album-section">
      <h2>Tracks</h2>

      <p v-if="isPending">Loading tracks...</p>
      <p v-else-if="isError">Failed to load tracks.</p>
      <p v-else-if="!album?.tracks?.length">No tracks found.</p>

      <div v-else>
        <TrackRow
          v-for="track in album.tracks"
          :key="track.providerId"
          :track="track"
          @play="onPlayTrack(track)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.album-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 48px;
}

.album-cover {
  width: 220px;
  height: 220px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 12px 40px rgb(0 0 0 / 30%);
}

.album-info h1 {
  margin: 8px 0;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
}

.album-info p {
  color: var(--sonora-muted);
}

.album-section {
  margin-bottom: 48px;
}

.album-section h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 700;
}

@media (max-width: 600px) {
  .album-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
  }

  .album-cover {
    width: 160px;
    height: 160px;
  }
}
</style>
