<script setup lang="ts">
import type { AlbumSummary } from '@music-app/shared-types'
import { RouterLink } from 'vue-router'

defineProps<{
  album: AlbumSummary
}>()

const getReleaseYear = (releaseDate: string | null) => {
  return releaseDate ? releaseDate.slice(0, 4) : null
}
</script>

<template>
  <RouterLink
    :to="{ name: 'album', params: { id: album.providerId } }"
    class="album-card"
  >
    <img
      v-if="album.cover.medium"
      :src="album.cover.medium"
      :alt="`${album.title} cover`"
      class="album-cover"
    />

    <div v-else class="album-cover album-cover-empty"></div>

    <strong>{{ album.title }}</strong>
    <span>{{ album.artist.name }}</span>
    <span v-if="getReleaseYear(album.releaseDate)" class="release-year">
      {{ getReleaseYear(album.releaseDate) }}
    </span>
  </RouterLink>
</template>

<style scoped>
.album-card {
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  text-decoration: none;
}

.album-cover {
  aspect-ratio: 1;
  border-radius: 6px;
  object-fit: cover;
  width: 100%;
}

.album-cover-empty {
  background: var(--sonora-card);
}

.album-card strong,
.album-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-card strong {
  font-size: 13px;
}

.album-card span {
  color: var(--sonora-muted);
  font-size: 11px;
}

.album-card:hover strong {
  color: var(--sonora-accent);
}
</style>
