<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { IconBell, IconChevronLeft, IconChevronRight, IconSearch } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const quickQuery = ref('')

const isHome = computed(() => route.name === ROUTE_NAMES.home)

const pageLabel = computed(() => {
  if (route.name === ROUTE_NAMES.search) return 'Search'
  if (route.name === ROUTE_NAMES.library) return 'Favorites'
  if (route.name === ROUTE_NAMES.profile) return 'Profile'
  if (route.name === ROUTE_NAMES.settings) return 'Settings'
  if (route.name === ROUTE_NAMES.artist) return 'Artist'
  if (route.name === ROUTE_NAMES.album) return 'Album'
  if (route.name === ROUTE_NAMES.playlist) return 'Playlist'
  return 'Home'
})

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

function onQuickSearch() {
  const q = quickQuery.value.trim()
  if (q) {
    router.push({ name: ROUTE_NAMES.search, query: { q } })
    quickQuery.value = ''
  }
}
</script>

<template>
  <header class="topbar">
    <div class="breadcrumb">
      <template v-if="isHome">
        <span>Discover</span>
        <IconChevronRight :size="15" />
        <strong>Home</strong>
      </template>
      <template v-else>
        <RouterLink :to="{ name: ROUTE_NAMES.home }" aria-label="Back to home">
          <IconChevronLeft :size="15" />
        </RouterLink>
        <strong>{{ pageLabel }}</strong>
      </template>
    </div>

    <div class="topbar-actions">
      <label class="search-box">
        <IconSearch :size="17" />
        <input
          v-model="quickQuery"
          placeholder="Search anything"
          aria-label="Search music"
          @keydown.enter="onQuickSearch"
        />
      </label>
      <button class="icon-button" aria-label="Notifications" type="button">
        <IconBell :size="19" />
      </button>
      <RouterLink :to="{ name: ROUTE_NAMES.profile }" class="avatar avatar-top">
        {{ userInitials }}
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 28px 5vw;
}

.breadcrumb {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 12px;
  gap: 8px;
}

.breadcrumb a {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb a:hover {
  color: var(--sonora-text);
}

.breadcrumb strong {
  color: var(--sonora-text);
  font-weight: 600;
}

.topbar-actions {
  align-items: center;
  display: flex;
  gap: 14px;
}

.search-box {
  align-items: center;
  background: #16161c;
  border: 1px solid #292930;
  border-radius: 9px;
  color: var(--sonora-muted);
  display: flex;
  gap: 9px;
  padding: 9px 12px;
  width: 190px;
}

.search-box input {
  background: transparent;
  border: 0;
  color: var(--sonora-text);
  font-size: 11px;
  outline: 0;
  width: 100%;
}

.search-box input::placeholder {
  color: #696970;
}

.icon-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--sonora-muted);
  cursor: pointer;
  display: flex;
  padding: 8px;
  transition: color 0.2s ease;
}

.icon-button:hover {
  color: var(--sonora-text);
}

.avatar {
  align-items: center;
  background: linear-gradient(135deg, #c87848, #6d3e40);
  border-radius: 50%;
  color: #fff;
  display: grid;
  font-size: 10px;
  font-weight: 700;
  height: 30px;
  place-items: center;
  text-decoration: none;
  width: 30px;
}

.avatar-top {
  height: 32px;
  width: 32px;
}

@media (max-width: 900px) {
  .topbar {
    padding-inline: 28px;
  }
}

@media (max-width: 640px) {
  .topbar {
    padding: 18px 20px;
  }

  .breadcrumb,
  .icon-button {
    display: none;
  }

  .search-box {
    flex: 1;
    width: auto;
  }

  .topbar-actions {
    width: 100%;
  }

  .avatar-top {
    display: none;
  }
}
</style>
