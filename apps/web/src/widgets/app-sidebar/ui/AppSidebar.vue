<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { IconHome, IconLibrary, IconSearch } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'

const route = useRoute()
const links = [
  { name: ROUTE_NAMES.home, label: 'Home', icon: IconHome },
  { name: ROUTE_NAMES.search, label: 'Search', icon: IconSearch },
  { name: ROUTE_NAMES.library, label: 'Library', icon: IconLibrary },
]
</script>

<template>
  <aside class="sidebar">
    <RouterLink class="brand" :to="{ name: ROUTE_NAMES.home }"><span>so</span>nora</RouterLink>
    <nav>
      <RouterLink
        v-for="link in links"
        :key="link.name"
        class="nav-link"
        :class="{ active: route.name === link.name }"
        :to="{ name: link.name }"
      >
        <component :is="link.icon" :size="18" />
        {{ link.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--sonora-sidebar);
  border-right: 1px solid #24242b;
  padding: 32px 20px;
}

.brand {
  color: var(--sonora-text);
  display: block;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.07em;
  margin: 0 12px 50px;
  text-decoration: none;
}

.brand span,
.active {
  color: var(--sonora-accent);
}

nav {
  display: grid;
  gap: 5px;
}

.nav-link {
  align-items: center;
  border-radius: 9px;
  color: var(--sonora-muted);
  display: flex;
  font-size: 13px;
  gap: 12px;
  padding: 11px 12px;
  text-decoration: none;
}

.nav-link:hover,
.nav-link.active {
  background: #1d1d24;
}

@media (max-width: 900px) {
  .sidebar {
    padding: 28px 10px;
  }

  .brand {
    font-size: 0;
    margin: 0 auto 50px;
    width: max-content;
  }

  .brand span {
    font-size: 24px;
  }

  .nav-link {
    font-size: 0;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .sidebar {
    background: var(--sonora-sidebar);
    border-right: 0;
    border-top: 1px solid #292930;
    bottom: 0;
    left: 0;
    padding: 8px;
    position: fixed;
    right: 0;
    z-index: 20;
  }

  .brand {
    display: none;
  }

  nav {
    display: flex;
    justify-content: space-around;
  }

  .nav-link {
    font-size: 10px;
  }
}
</style>
