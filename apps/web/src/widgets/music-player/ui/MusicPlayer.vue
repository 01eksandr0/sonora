<script setup lang="ts">
import { ref } from 'vue'
import {
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconVolume2,
} from '@tabler/icons-vue'

const isPlaying = ref(false)
const isLiked = ref(false)

function togglePlay() {
  isPlaying.value = !isPlaying.value
}

function toggleLike() {
  isLiked.value = !isLiked.value
}
</script>

<template>
  <footer class="player-bar">
    <div class="player-track">
      <div class="artwork art-rust size-11 rounded-xl" aria-hidden="true">
        <span class="artwork-shape" />
        <span class="artwork-shape artwork-shape-two" />
      </div>
      <div>
        <strong>My Own Summer</strong>
        <span>Deftones</span>
      </div>
      <button
        class="player-heart"
        :class="{ 'is-liked': isLiked }"
        aria-label="Favorite track"
        type="button"
        @click="toggleLike"
      >
        <IconHeart :size="17" :fill="isLiked ? 'currentColor' : 'none'" />
      </button>
    </div>

    <div class="player-controls">
      <div class="control-buttons">
        <button aria-label="Previous" type="button">
          <IconChevronLeft :size="16" />
        </button>
        <button
          class="main-play"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          type="button"
          @click="togglePlay"
        >
          <IconPlayerPauseFilled v-if="isPlaying" :size="16" />
          <IconPlayerPlayFilled v-else :size="16" />
        </button>
        <button aria-label="Next" type="button">
          <IconChevronRight :size="16" />
        </button>
      </div>
      <div class="progress-line">
        <span />
        <i />
      </div>
    </div>

    <div class="player-actions">
      <span>1:42</span>
      <IconVolume2 :size="18" />
      <div class="volume-line">
        <span />
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

.player-track > div:nth-child(2) {
  min-width: 0;
}

.player-track strong {
  color: var(--sonora-text);
  display: block;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-track span {
  color: var(--sonora-muted);
  display: block;
  font-size: 10px;
  margin-top: 4px;
}

.player-heart {
  background: transparent;
  border: 0;
  color: #7f7f86;
  cursor: pointer;
  margin-left: 6px;
  padding: 5px;
  transition: color 0.2s ease;
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
  height: 3px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.progress-line span {
  background: var(--sonora-accent);
  display: block;
  height: 100%;
  width: 33%;
}

.progress-line i {
  background: var(--sonora-accent);
  border-radius: 50%;
  height: 7px;
  left: 32%;
  position: absolute;
  top: -2px;
  width: 7px;
}

.player-actions {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 10px;
  gap: 13px;
  justify-content: flex-end;
}

.volume-line {
  width: 70px;
}

.volume-line span {
  background: var(--sonora-text);
  display: block;
  height: 100%;
  width: 70%;
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
