<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  IconDots,
  IconHome2,
  IconLibrary,
  IconSearch,
  IconSettings,
  IconUser,
  IconList,
  IconDisc,
  IconUsers,
} from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const route = useRoute()
const session = useSessionStore()

const discoverLinks = [
  { name: ROUTE_NAMES.home, label: 'Home', icon: IconHome2 },
  { name: ROUTE_NAMES.search, label: 'Search', icon: IconSearch },
]

const libraryLinks = [
  { name: ROUTE_NAMES.library, label: 'Favorites', icon: IconLibrary },
  { name: ROUTE_NAMES.playlists, label: 'Playlists', icon: IconList },
  { name: ROUTE_NAMES.albums, label: 'Albums', icon: IconDisc },
  { name: ROUTE_NAMES.artists, label: 'Artists', icon: IconUsers },
]

const mobileLinks = [
  { name: ROUTE_NAMES.home, label: 'Home', icon: IconHome2 },
  { name: ROUTE_NAMES.search, label: 'Search', icon: IconSearch },
  { name: ROUTE_NAMES.library, label: 'Favorites', icon: IconLibrary },
  { name: ROUTE_NAMES.profile, label: 'Profile', icon: IconUser },
  { name: ROUTE_NAMES.settings, label: 'Settings', icon: IconSettings },
]

const userName = computed(() => {
  return session.user?.profile?.displayName || session.user?.email?.split('@')[0] || 'Alex K.'
})

const userInitials = computed(() => {
  const name = userName.value.trim()
  const parts = name.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <aside class="sonora-sidebar">
    <RouterLink class="brand-mark" :to="{ name: ROUTE_NAMES.home }">
      <span>so</span>nora
    </RouterLink>

    <div class="nav-group">
      <p class="nav-label">Discover</p>
      <RouterLink
        v-for="link in discoverLinks"
        :key="link.name"
        class="nav-item"
        :class="{ 'is-active': route.name === link.name }"
        :to="{ name: link.name }"
      >
        <component :is="link.icon" :size="19" :stroke-width="1.8" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </div>

    <div class="nav-group library-group">
      <p class="nav-label">Your library</p>
      <RouterLink
        v-for="link in libraryLinks"
        :key="link.name"
        class="nav-item"
        :class="{ 'is-active': route.name === link.name }"
        :to="{ name: link.name }"
      >
        <component :is="link.icon" :size="19" :stroke-width="1.8" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </div>

    <div class="sidebar-bottom">
      <RouterLink
        class="nav-item"
        :class="{ 'is-active': route.name === ROUTE_NAMES.settings }"
        :to="{ name: ROUTE_NAMES.settings }"
      >
        <IconSettings :size="19" :stroke-width="1.8" />
        <span>Settings</span>
      </RouterLink>

      <RouterLink class="profile-chip" :to="{ name: ROUTE_NAMES.profile }">
        <div class="avatar">{{ userInitials }}</div>
        <div>
          <strong>{{ userName }}</strong>
          <span>Listening now</span>
        </div>
        <IconDots :size="17" />
      </RouterLink>
    </div>
  </aside>

  <!-- Mobile Navigation Bar -->
  <nav class="mobile-nav" aria-label="Mobile navigation">
    <RouterLink
      v-for="link in mobileLinks"
      :key="link.name"
      class="mobile-nav-item"
      :class="{ 'is-active': route.name === link.name }"
      :to="{ name: link.name }"
    >
      <component :is="link.icon" :size="18" :stroke-width="1.8" />
      <span>{{ link.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.sonora-sidebar {
  background: var(--sonora-sidebar);
  border-right: 1px solid #24242b;
  display: flex;
  flex-direction: column;
  height: 100%;
  inset: 0 auto 0 0;
  padding: 32px 20px 20px;
  position: fixed;
  width: 232px;
  z-index: 5;
}

.brand-mark {
  color: var(--sonora-text);
  display: block;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.07em;
  margin: 0 12px 62px;
  text-decoration: none;
}

.brand-mark span {
  color: var(--sonora-accent);
}

.nav-group {
  display: grid;
  gap: 5px;
}

.nav-label {
  color: var(--sonora-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 12px 12px;
  text-transform: uppercase;
}

.library-group {
  margin-top: 38px;
}

.nav-item {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: #898991;
  display: flex;
  font-size: 13px;
  gap: 13px;
  padding: 11px 12px;
  text-align: left;
  text-decoration: none;
  transition:
    background 0.2s,
    color 0.2s;
  width: 100%;
}

.nav-item:hover,
.nav-item.is-active {
  background: #1d1d24;
  color: var(--sonora-text);
}

.nav-item.is-active {
  color: var(--sonora-accent);
}

.sidebar-bottom {
  margin-top: auto;
}

.profile-chip {
  align-items: center;
  border-top: 1px solid #25252c;
  color: var(--sonora-text);
  display: flex;
  gap: 10px;
  margin-top: 18px;
  padding: 20px 10px 0;
  text-decoration: none;
}

.profile-chip strong,
.profile-chip span {
  display: block;
}

.profile-chip strong {
  font-size: 12px;
  font-weight: 600;
}

.profile-chip span {
  color: var(--sonora-muted);
  font-size: 10px;
  margin-top: 3px;
}

.profile-chip > svg {
  color: var(--sonora-muted);
  margin-left: auto;
}

.avatar {
  align-items: center;
  background: linear-gradient(135deg, #c87848, #6d3e40);
  border-radius: 50%;
  color: #fff;
  display: grid;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  height: 30px;
  place-items: center;
  width: 30px;
}

.mobile-nav {
  display: none;
}

@media (max-width: 900px) {
  .sonora-sidebar {
    padding-inline: 12px;
    width: 78px;
  }

  .brand-mark {
    font-size: 0;
    margin: 0 auto 62px;
    text-align: center;
  }

  .brand-mark span {
    font-size: 24px;
  }

  .nav-label,
  .nav-item span {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding-inline: 10px;
  }

  .nav-item svg {
    flex: 0 0 auto;
  }

  .profile-chip {
    justify-content: center;
    padding-inline: 0;
  }

  .profile-chip > div:not(.avatar),
  .profile-chip > svg {
    display: none;
  }
}

@media (max-width: 640px) {
  .sonora-sidebar {
    display: none;
  }

  .mobile-nav {
    align-items: center;
    background: rgba(16, 16, 20, 0.98);
    border-top: 1px solid #292930;
    bottom: 0;
    display: flex;
    gap: 18px;
    height: 64px;
    inset: auto 0 0;
    justify-content: space-around;
    padding: 8px 16px;
    position: fixed;
    width: 100%;
    z-index: 20;
  }

  .mobile-nav-item {
    align-items: center;
    color: var(--sonora-muted);
    display: flex;
    flex-direction: column;
    font-size: 10px;
    gap: 4px;
    justify-content: center;
    min-width: 48px;
    text-decoration: none;
  }

  .mobile-nav-item.is-active {
    color: var(--sonora-accent);
  }
}
</style>
