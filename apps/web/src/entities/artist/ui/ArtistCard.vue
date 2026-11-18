<script setup lang="ts">
import type { ArtistSummary } from '@music-app/shared-types'
import { RouterLink } from 'vue-router'
import { IconUser } from '@tabler/icons-vue'

defineProps<{
  artist: ArtistSummary
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'artist', params: { id: artist.providerId } }"
    class="artist-card"
  >
    <img
      v-if="artist.images.medium"
      :src="artist.images.medium"
      :alt="artist.name"
      class="artist-image"
    />

    <div v-else class="artist-image artist-image-empty">
      <IconUser :size="28" />
    </div>

    <strong>{{ artist.name }}</strong>
  </RouterLink>
</template>

<style scoped>
.artist-card {
  align-items: center;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  text-decoration: none;
  width: 130px;
}

.artist-image {
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  width: 100%;
}

.artist-image-empty {
  align-items: center;
  background: var(--sonora-card);
  color: var(--sonora-muted);
  display: flex;
  justify-content: center;
}

.artist-card strong {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.artist-card:hover strong {
  color: var(--sonora-accent);
}
</style>
