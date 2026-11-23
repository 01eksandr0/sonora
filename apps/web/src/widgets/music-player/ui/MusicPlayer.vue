<script setup lang="ts">
import {
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconMusic,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconVolume,
  IconVolume2,
} from '@tabler/icons-vue'
import { usePlayerStore } from '@/features/player'

const playerStore = usePlayerStore()

function formatTime(seconds: number): string {
  const s = Math.floor(seconds || 0)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}

function onSeekClick(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const ratio = Math.max(0, Math.min(1, clickX / rect.width))
  playerStore.seek(ratio * playerStore.duration)
}

function onVolumeClick(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const ratio = Math.max(0, Math.min(1, clickX / rect.width))
  playerStore.setVolume(Math.round(ratio * 100))
}
</script>

<template>
  <footer v-if="playerStore.currentTrack" class="player-bar">
    <div class="player-track">
      <img
        v-if="playerStore.currentTrack.album?.cover?.small"
        :src="playerStore.currentTrack.album.cover.small"
        :alt="playerStore.currentTrack.title"
        class="track-cover"
      />
      <div v-else class="artwork art-rust size-11 rounded-xl" aria-hidden="true">
        <IconMusic :size="18" class="text-white/60" />
      </div>

      <div class="track-meta">
        <strong>{{ playerStore.currentTrack.title }}</strong>
        <span>{{ playerStore.currentTrack.artist.name }}</span>
      </div>

      <button
        class="player-heart"
        :class="{ 'is-liked': playerStore.isLiked }"
        aria-label="Favorite track"
        type="button"
        @click="playerStore.toggleLike"
      >
        <IconHeart :size="17" :fill="playerStore.isLiked ? 'currentColor' : 'none'" />
      </button>
    </div>

    <div class="player-controls">
      <div class="control-buttons">
        <button aria-label="Previous" type="button" @click="playerStore.previous">
          <IconChevronLeft :size="16" />
        </button>
        <button
          class="main-play"
          :aria-label="playerStore.isPlaying ? 'Pause' : 'Play'"
          type="button"
          @click="playerStore.togglePlay"
        >
          <IconPlayerPauseFilled v-if="playerStore.isPlaying" :size="16" />
          <IconPlayerPlayFilled v-else :size="16" />
        </button>
        <button aria-label="Next" type="button" @click="playerStore.next">
          <IconChevronRight :size="16" />
        </button>
      </div>

      <div class="progress-line" role="slider" aria-label="Seek track" @click="onSeekClick">
        <span :style="{ width: `${playerStore.progressPercent}%` }" />
        <i :style="{ left: `${playerStore.progressPercent}%` }" />
      </div>
    </div>

    <div class="player-actions">
      <span>{{ formatTime(playerStore.currentTime) }}</span>
      <button
        type="button"
        class="volume-btn"
        aria-label="Toggle mute"
        @click="playerStore.toggleMute"
      >
        <IconVolume2 v-if="!playerStore.isMuted && playerStore.volume > 0" :size="18" />
        <IconVolume v-else :size="18" />
      </button>
      <div class="volume-line" role="slider" aria-label="Adjust volume" @click="onVolumeClick">
        <span :style="{ width: `${playerStore.isMuted ? 0 : playerStore.volume}%` }" />
      </div>
    </div>
  </footer>
</template>

<style scoped>
.player-bar {
  align-items: center;
  background: rgba(20, 20, 26, 0.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid #2b2b32;
  bottom: 0;
  display: grid;
  gap: 30px;
  grid-template-columns: 1fr 1.15fr 1fr;
  left: 0;
  padding: 15px 32px;
  position: fixed;
  right: 0;
  z-index: 10;
}

.player-track {
  align-items: center;
  display: flex;
  gap: 11px;
  min-width: 0;
}

.track-cover {
  border-radius: 12px;
  height: 44px;
  object-fit: cover;
  width: 44px;
  flex-shrink: 0;
}

.track-meta {
  min-width: 0;
}

.track-meta strong {
  color: var(--sonora-text);
  display: block;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta span {
  color: var(--sonora-muted);
  display: block;
  font-size: 10px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-heart {
  background: transparent;
  border: 0;
  color: #7f7f86;
  cursor: pointer;
  margin-left: 6px;
  padding: 5px;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.player-heart.is-liked {
  color: var(--sonora-accent);
}

.player-controls {
  display: grid;
  gap: 10px;
  justify-items: center;
}

.control-buttons {
  align-items: center;
  display: flex;
  gap: 17px;
}

.control-buttons button {
  background: transparent;
  border: 0;
  color: #a9a9ad;
  cursor: pointer;
  display: flex;
  padding: 4px;
  transition: color 0.2s ease;
}

.control-buttons button:hover {
  color: var(--sonora-text);
}

.control-buttons .main-play {
  align-items: center;
  background: var(--sonora-text);
  border-radius: 50%;
  color: #111116;
  display: flex;
  height: 29px;
  justify-content: center;
  width: 29px;
  transition: transform 0.15s ease;
}

.control-buttons .main-play:hover {
  transform: scale(1.05);
}

.progress-line,
.volume-line {
  background: #404048;
  border-radius: 5px;
  cursor: pointer;
  height: 3px;
  overflow: visible;
  position: relative;
  width: 100%;
}

.progress-line span {
  background: var(--sonora-accent);
  display: block;
  height: 100%;
  border-radius: 5px;
  pointer-events: none;
}

.progress-line i {
  background: var(--sonora-accent);
  border-radius: 50%;
  height: 7px;
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  width: 7px;
  pointer-events: none;
}

.player-actions {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 10px;
  gap: 13px;
  justify-content: flex-end;
}

.volume-btn {
  background: transparent;
  border: 0;
  color: var(--sonora-muted);
  cursor: pointer;
  display: flex;
  padding: 2px;
  transition: color 0.2s ease;
}

.volume-btn:hover {
  color: var(--sonora-text);
}

.volume-line {
  width: 70px;
  overflow: hidden;
}

.volume-line span {
  background: var(--sonora-text);
  display: block;
  height: 100%;
  border-radius: 5px;
  pointer-events: none;
}

@media (max-width: 640px) {
  .player-bar {
    bottom: 64px;
    gap: 10px;
    grid-template-columns: 1fr auto;
    padding: 10px 17px;
  }

  .player-controls {
    display: flex;
    order: 2;
  }

  .player-controls .progress-line,
  .player-controls .control-buttons button:not(.main-play),
  .player-actions {
    display: none;
  }

  .player-track {
    order: 1;
  }

  .player-heart {
    display: none;
  }
}
</style>
