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
  <div class="sonora-shell min-h-full" :class="{ 'app-layout--onboarding': isOnboarding }">
    <template v-if="!isOnboarding">
      <AppSidebar />

      <div class="sonora-main">
        <AppHeader />
        <main class="sonora-content">
          <RouterView />
        </main>
      </div>

      <MusicPlayer />
    </template>

    <main v-else class="app-layout__onboarding">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.sonora-shell {
  background: var(--sonora-bg);
  color: var(--sonora-text);
  display: flex;
  min-height: 100vh;
  padding-bottom: 92px;
}

.sonora-main {
  margin-left: 232px;
  min-width: 0;
  width: calc(100% - 232px);
}

.sonora-content {
  flex: 1;
  min-width: 0;
}

.app-layout--onboarding {
  display: block;
  padding-bottom: 0;
}

.app-layout__onboarding {
  min-height: 100dvh;
}

@media (max-width: 900px) {
  .sonora-main {
    margin-left: 78px;
    width: calc(100% - 78px);
  }
}

@media (max-width: 640px) {
  .sonora-shell {
    display: block;
    padding-bottom: 116px;
  }

  .sonora-main {
    margin-left: 0;
    min-height: calc(100dvh - 116px);
    width: 100%;
  }
}
</style>
