<script setup lang="ts">
import { IconHeadphones } from '@tabler/icons-vue'
</script>

<template>
  <footer class="music-player">
    <div class="player-status">
      <span class="player-icon"><IconHeadphones :size="17" /></span>
      <div>
        <strong>Ready when you are</strong>
        <span>Choose a track from your collection</span>
      </div>
    </div>
    <span class="player-caption">Your sound, your pace.</span>
  </footer>
</template>

<style scoped>
.music-player {
  align-items: center;
  background: rgb(20 20 26 / 96%);
  border-top: 1px solid #2b2b32;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  left: 0;
  min-height: 76px;
  padding: 12px 32px;
  position: sticky;
  z-index: 10;
}

.player-status {
  align-items: center;
  display: flex;
  gap: 12px;
}

.player-icon {
  align-items: center;
  background: #25252d;
  border-radius: 7px;
  color: var(--sonora-accent);
  display: flex;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.player-status strong,
.player-status span {
  display: block;
}

.player-status strong {
  color: var(--sonora-text);
  font-size: 11px;
  font-weight: 600;
}

.player-status div > span {
  color: var(--sonora-muted);
  font-size: 10px;
  margin-top: 4px;
}

.player-caption {
  color: var(--sonora-muted);
  font-size: 10px;
}

@media (max-width: 640px) {
  .music-player {
    display: none;
  }
}
</style>
