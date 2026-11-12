<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { IconChevronRight, IconSearch } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const route = useRoute()
const session = useSessionStore()
const pageTitle = computed(() => {
  if (route.name === ROUTE_NAMES.search) return 'Search'
  if (route.name === ROUTE_NAMES.library) return 'Your library'
  if (route.name === ROUTE_NAMES.settings) return 'Settings'
  return 'Home'
})
const initial = computed(() =>
  (session.user?.profile?.displayName || session.user?.email || 'L').slice(0, 1).toUpperCase(),
)
</script>

<template>
  <header class="app-header">
    <div class="header-breadcrumb">
      <span>Sonora</span>
      <IconChevronRight :size="14" />
      <strong>{{ pageTitle }}</strong>
    </div>
    <div class="header-actions">
      <RouterLink class="header-search" :to="{ name: ROUTE_NAMES.search }">
        <IconSearch :size="15" />
        <span>Search artists, tracks, albums</span>
      </RouterLink>
      <span class="header-avatar">{{ initial }}</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 28px 5vw;
}

.header-breadcrumb {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 12px;
  gap: 8px;
}

.header-breadcrumb strong {
  color: var(--sonora-text);
  font-weight: 600;
}

.header-actions {
  align-items: center;
  display: flex;
  gap: 14px;
}

.header-search {
  align-items: center;
  background: #16161c;
  border: 1px solid #292930;
  border-radius: 9px;
  color: var(--sonora-muted);
  display: flex;
  font-size: 11px;
  gap: 9px;
  padding: 9px 12px;
  text-decoration: none;
  width: 240px;
}

.header-search:hover {
  border-color: #44444c;
  color: var(--sonora-text);
}

.header-avatar {
  align-items: center;
  background: linear-gradient(135deg, #c87848, #6d3e40);
  border-radius: 50%;
  color: #fff;
  display: flex;
  font-size: 11px;
  font-weight: 700;
  height: 32px;
  justify-content: center;
  width: 32px;
}

@media (max-width: 900px) {
  .app-header {
    padding-inline: 28px;
  }
}

@media (max-width: 640px) {
  .app-header {
    padding: 18px 20px;
  }

  .header-breadcrumb,
  .header-avatar {
    display: none;
  }

  .header-actions,
  .header-search {
    width: 100%;
  }
}
</style>
