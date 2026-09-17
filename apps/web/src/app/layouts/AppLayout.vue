<script setup lang="ts">
import { RouterView } from 'vue-router'
import { AppHeader } from '@/widgets/app-header'
import { AppSidebar } from '@/widgets/app-sidebar'
import { MusicPlayer } from '@/widgets/music-player'
</script>

<template>
  <div class="app-layout">
    <AppSidebar class="app-layout__sidebar" />
    <div class="app-layout__main">
      <AppHeader />
      <main class="app-layout__content">
        <RouterView />
      </main>
    </div>
    <MusicPlayer class="app-layout__player" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 1fr auto;
}
.app-layout__sidebar {
  grid-row: 1;
}
.app-layout__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-layout__content {
  flex: 1;
  padding: 1.5rem;
}
.app-layout__player {
  grid-column: 1 / -1;
}
</style>
