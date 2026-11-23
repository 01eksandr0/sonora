<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AppHeader } from '@/widgets/app-header'
import { AppSidebar } from '@/widgets/app-sidebar'
import { MusicPlayer } from '@/widgets/music-player'
import { ROUTE_NAMES } from '@/app/router/routes'
import { usePlayerStore } from '@/features/player'

const route = useRoute()
const playerStore = usePlayerStore()
// Restore the session here, not in MusicPlayer: the widget only mounts once a track exists.
onMounted(() => playerStore.initFromBackend())

const isOnboarding = computed(() => route.name === ROUTE_NAMES.onboarding)
const isProfile = computed(
  () => route.name === ROUTE_NAMES.profile || route.path.endsWith('/profile'),
)

const showPlayer = computed(
  () => !isOnboarding.value && !isProfile.value && !!playerStore.currentTrack,
)
</script>

<template>
  <div
    class="sonora-shell min-h-full"
    :class="{
      'app-layout--onboarding': isOnboarding,
      'has-player': showPlayer,
    }"
  >
    <template v-if="!isOnboarding">
      <AppSidebar />

      <div class="sonora-main">
        <AppHeader />
        <main class="sonora-content">
          <RouterView />
        </main>
      </div>

      <MusicPlayer v-if="showPlayer" />
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
  padding-bottom: 0;
}

.sonora-shell.has-player {
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
    padding-bottom: 0;
  }

  .sonora-shell.has-player {
    padding-bottom: 116px;
  }

  .sonora-main {
    margin-left: 0;
    min-height: 100dvh;
    width: 100%;
  }

  .sonora-shell.has-player .sonora-main {
    min-height: calc(100dvh - 116px);
  }
}
</style>
