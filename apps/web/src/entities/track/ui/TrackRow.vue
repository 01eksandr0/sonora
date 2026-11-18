<script setup lang="ts">
import type { TrackSummary } from '@music-app/shared-types'
import { IconMusic } from '@tabler/icons-vue'

defineProps<{
  track: TrackSummary
  index?: number
}>()

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}
</script>

<template>
  <div class="track-row">
    <span v-if="index !== undefined" class="track-number">
      {{ index + 1 }}
    </span>

    <img
      v-if="track.album.cover.small"
      class="cover"
      :src="track.album.cover.small"
      :alt="`${track.album.title} cover`"
    />

    <div v-else class="cover cover-empty">
      <IconMusic :size="18" />
    </div>

    <div class="track-name">
      <strong>{{ track.title }}</strong>
      <span>{{ track.artist.name }}</span>
    </div>

    <span class="album">{{ track.album.title }}</span>
    <span class="duration">{{ formatDuration(track.duration) }}</span>
  </div>
</template>

<style scoped>
.track-row {
  align-items: center;
  border-bottom: 1px solid #202027;
  display: grid;
  gap: 14px;
  grid-template-columns: 24px 44px minmax(0, 1fr) minmax(100px, 0.8fr) 45px;
  padding: 9px 4px;
}

.track-row:hover {
  background: #15151b;
}

.track-number,
.album,
.duration {
  color: var(--sonora-muted);
  font-size: 12px;
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

.duration {
  text-align: right;
}

@media (max-width: 640px) {
  .track-row {
    gap: 10px;
    grid-template-columns: 20px 40px minmax(0, 1fr) 40px;
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
