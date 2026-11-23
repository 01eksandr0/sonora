<script setup lang="ts">
import { computed } from 'vue'
import type { TrackSummary } from '@music-app/shared-types'
import {
  IconMusic,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from '@tabler/icons-vue'
import { usePlayerStore } from '@/features/player'
import { SonoraEqualizer } from '@/shared/ui'

const props = defineProps<{
  track: TrackSummary
  index?: number
}>()

const emit = defineEmits<{
  play: [track: TrackSummary]
}>()

const playerStore = usePlayerStore()

const isCurrent = computed(
  () => playerStore.currentTrack?.providerId === props.track.providerId,
)
const isPlaying = computed(() => isCurrent.value && playerStore.isPlaying)

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function handleClick() {
  if (isCurrent.value) {
    playerStore.togglePlay()
  } else {
    emit('play', props.track)
  }
}
</script>

<template>
  <div
    class="track-row cursor-pointer"
    :class="{ 'is-playing': isCurrent }"
    role="button"
    tabindex="0"
    @click="handleClick"
  >
    <span v-if="index !== undefined" class="track-number">
      <template v-if="isPlaying">
        <SonoraEqualizer class="eq-indicator" />
        <IconPlayerPauseFilled :size="14" class="play-indicator active hover-pause" />
      </template>
      <template v-else-if="isCurrent">
        <IconPlayerPlayFilled :size="14" class="play-indicator active" />
      </template>
      <template v-else>
        <span class="num-text">{{ index + 1 }}</span>
        <IconPlayerPlayFilled :size="14" class="hover-play" />
      </template>
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
  cursor: pointer;
  display: grid;
  gap: 14px;
  grid-template-columns: 24px 44px minmax(0, 1fr) minmax(100px, 0.8fr) 45px;
  padding: 9px 4px;
  transition: background 0.15s ease;
}

.track-row:hover {
  background: #15151b;
}

.track-row.is-playing strong {
  color: var(--sonora-accent);
}

.track-row.is-playing .track-number {
  color: var(--sonora-accent);
}

.track-number {
  color: #6d6d75;
  font-size: 11px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.track-row .play-indicator.hover-pause,
.track-row:hover .eq-indicator {
  display: none;
}

.track-row:hover .play-indicator.hover-pause {
  display: block;
}

.hover-play {
  display: none;
  color: var(--sonora-text);
}

.track-row:hover .num-text {
  display: none;
}

.track-row:hover .hover-play {
  display: block;
}

.play-indicator.active {
  color: var(--sonora-accent);
  display: block;
}

.album,
.duration {
  color: var(--sonora-muted);
  font-size: 12px;
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
  color: var(--sonora-text);
  transition: color 0.15s ease;
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
