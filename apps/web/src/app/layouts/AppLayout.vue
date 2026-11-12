<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AppHeader } from '@/widgets/app-header'
import { AppSidebar } from '@/widgets/app-sidebar'
import { MusicPlayer } from '@/widgets/music-player'
import { ROUTE_NAMES } from '@/app/router/routes'

const route = useRoute()
const isOnboarding = computed(() => route.name === ROUTE_NAMES.onboarding)
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--onboarding': isOnboarding }">
    <template v-if="!isOnboarding">
      <AppSidebar class="app-layout__sidebar" />

      <div class="app-layout__main">
        <AppHeader />
        <main class="app-layout__content">
          <RouterView />
        </main>
      </div>

      <MusicPlayer class="app-layout__player" />
    </template>

    <main v-else class="app-layout__onboarding">
      <RouterView />
    </main>
  </div>
</template>
<style scoped>
.app-layout {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
}

.app-layout__sidebar {
  grid-row: 1;
  grid-column: 1;
}

.app-layout__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  grid-column: 2;
}

.app-layout__content {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.app-layout__player {
  grid-column: 1 / -1;
}

.app-layout--onboarding {
  display: block;
}

.app-layout__onboarding {
  min-height: 100dvh;
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 78px minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .app-layout {
    display: block;
    padding-bottom: 64px;
  }

  .app-layout__main {
    min-height: calc(100dvh - 64px);
  }
}
</style>
