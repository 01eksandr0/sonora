<script setup lang="ts">
import type { TrackSummary } from '@music-app/shared-types'
import { IconMusic } from '@tabler/icons-vue'

defineProps<{
  tracks: TrackSummary[]
  loading: boolean
  refreshing: boolean
  error: boolean
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="collection">
    <div class="collection-heading">
      <div>
        <p class="eyebrow">UPDATED EVERY WEEK</p>
        <h2>This week for you</h2>
      </div>
      <span v-if="tracks.length">{{ tracks.length }} songs</span>
    </div>

    <p v-if="loading || refreshing" class="message">Finding songs from your favorite artists…</p>
    <div v-else-if="error" class="message" role="alert">
      <p>Couldn't load your collection.</p>
      <button type="button" @click="$emit('retry')">Try again</button>
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
      <p v-if="tracks.length < 50" class="collection-note">
        Showing {{ tracks.length }} of 50 available songs.
      </p>
    </div>
  </section>
</template>

<style scoped>
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

.collection-note {
  color: var(--sonora-muted);
  font-size: 11px;
  margin: 14px 4px;
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
