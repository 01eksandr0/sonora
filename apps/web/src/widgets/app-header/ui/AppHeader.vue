<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { IconSearch } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
</script>

<template>
  <header class="header">
    <span>Discover music you love</span>
    <RouterLink :to="{ name: ROUTE_NAMES.search }">
      <IconSearch :size="16" />
      Search music
    </RouterLink>
  </header>
</template>

<style scoped>
.header {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  padding: 24px 5vw;
}

a {
  align-items: center;
  background: #16161c;
  border: 1px solid #292930;
  border-radius: 8px;
  color: var(--sonora-muted);
  display: flex;
  font-size: 11px;
  gap: 8px;
  padding: 9px 12px;
  text-decoration: none;
}

a:hover {
  color: var(--sonora-text);
}

@media (max-width: 640px) {
  .header {
    padding: 16px 20px;
  }
}
</style>
