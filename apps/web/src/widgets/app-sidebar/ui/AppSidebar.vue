<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { IconAdjustments, IconAlbum, IconHome, IconLibrary, IconSearch } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const route = useRoute()
const session = useSessionStore()
const displayName = computed(
  () => session.user?.profile?.displayName || session.user?.email || 'Listener',
)

function isActive(routeName: string) {
  return route.name === routeName
}
</script>

<template>
  <aside class="app-sidebar">
    <RouterLink class="sidebar-brand" :to="{ name: ROUTE_NAMES.home }"
      ><span>so</span>nora</RouterLink
    >

    <nav class="sidebar-nav" aria-label="Main navigation">
      <p class="sidebar-label">Menu</p>
      <RouterLink
        class="sidebar-link"
        :class="{ 'is-active': isActive(ROUTE_NAMES.home) }"
        :to="{ name: ROUTE_NAMES.home }"
      >
        <IconHome :size="18" />
        <span>Home</span>
      </RouterLink>
      <RouterLink
        class="sidebar-link"
        :class="{ 'is-active': isActive(ROUTE_NAMES.search) }"
        :to="{ name: ROUTE_NAMES.search }"
      >
        <IconSearch :size="18" />
        <span>Search</span>
      </RouterLink>

      <div class="sidebar-library">
        <p class="sidebar-label">Your library</p>
        <RouterLink
          class="sidebar-link"
          :class="{ 'is-active': isActive(ROUTE_NAMES.library) }"
          :to="{ name: ROUTE_NAMES.library }"
        >
          <IconLibrary :size="18" />
          <span>Liked music</span>
        </RouterLink>
        <RouterLink class="sidebar-link" :to="{ name: ROUTE_NAMES.library }">
          <IconAlbum :size="18" />
          <span>Albums</span>
        </RouterLink>
      </div>
    </nav>

    <RouterLink class="sidebar-profile" :to="{ name: ROUTE_NAMES.settings }">
      <span class="sidebar-avatar">{{ displayName.slice(0, 1).toUpperCase() }}</span>
      <span class="sidebar-profile-name">{{ displayName }}</span>
      <IconAdjustments :size="17" />
    </RouterLink>
  </aside>
</template>

<style scoped>
.app-sidebar {
  background: var(--sonora-sidebar);
  border-right: 1px solid #24242b;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 32px 20px 20px;
}

.sidebar-brand {
  color: var(--sonora-text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.07em;
  margin: 0 12px 62px;
  text-decoration: none;
}

.sidebar-brand span {
  color: var(--sonora-accent);
}

.sidebar-label {
  color: var(--sonora-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 12px 12px;
  text-transform: uppercase;
}

.sidebar-nav {
  display: grid;
  gap: 5px;
}

.sidebar-link {
  align-items: center;
  background: transparent;
  border-radius: 10px;
  color: #898991;
  display: flex;
  font-size: 13px;
  gap: 13px;
  padding: 11px 12px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.sidebar-link:hover,
.sidebar-link.is-active {
  background: #1d1d24;
  color: var(--sonora-accent);
}

.sidebar-library {
  display: grid;
  gap: 5px;
  margin-top: 33px;
}

.sidebar-profile {
  align-items: center;
  border-top: 1px solid #25252c;
  color: var(--sonora-text);
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding: 20px 10px 0;
  text-decoration: none;
}

.sidebar-avatar {
  align-items: center;
  background: linear-gradient(135deg, #c87848, #6d3e40);
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex: 0 0 30px;
  font-size: 10px;
  font-weight: 700;
  height: 30px;
  justify-content: center;
}

.sidebar-profile-name {
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-profile > svg {
  color: var(--sonora-muted);
  flex: 0 0 auto;
}

@media (max-width: 900px) {
  .app-sidebar {
    align-items: center;
    padding-inline: 12px;
  }

  .sidebar-brand {
    font-size: 0;
    margin-inline: auto;
  }

  .sidebar-brand span {
    font-size: 24px;
  }

  .sidebar-label,
  .sidebar-link span,
  .sidebar-profile-name,
  .sidebar-profile > svg {
    display: none;
  }

  .sidebar-link {
    justify-content: center;
    padding-inline: 10px;
  }

  .sidebar-profile {
    justify-content: center;
    padding-inline: 0;
  }
}

@media (max-width: 640px) {
  .app-sidebar {
    border-right: 0;
    border-top: 1px solid #292930;
    bottom: 0;
    flex-direction: row;
    height: 64px;
    inset: auto 0 0;
    padding: 8px 16px;
    position: fixed;
    z-index: 20;
  }

  .sidebar-brand,
  .sidebar-library,
  .sidebar-profile {
    display: none;
  }

  .sidebar-nav {
    display: flex;
    flex: 1;
    justify-content: space-around;
  }

  .sidebar-link {
    flex-direction: column;
    font-size: 10px;
    gap: 4px;
    min-width: 48px;
    padding: 6px;
  }

  .sidebar-link span {
    display: block;
  }
}
</style>
