<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { IconArrowUpRight } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
</script>

<template>
  <main class="library-page">
    <p class="eyebrow">YOUR LIBRARY</p>
    <h1>Your favorites</h1>
    <div class="empty-state">
      <div class="empty-orbit"><span /><span /></div>
      <h2>Tracks you save will appear here</h2>
      <p>Keep exploring and your collection will grow with you.</p>
      <RouterLink class="discover-link" :to="{ name: ROUTE_NAMES.search }">
        Discover music
        <IconArrowUpRight :size="15" />
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.library-page {
  color: var(--sonora-text);
  margin: 0 auto;
  max-width: 1240px;
  padding: 44px 5vw 60px;
}

.eyebrow {
  color: var(--sonora-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

h1 {
  font-size: clamp(38px, 5vw, 68px);
  letter-spacing: -0.07em;
  line-height: 0.95;
  margin: 14px 0 48px;
}

.empty-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 360px;
  text-align: center;
}

.empty-orbit {
  background: #171c1c;
  border-radius: 50%;
  height: 125px;
  margin-bottom: 28px;
  overflow: hidden;
  position: relative;
  width: 125px;
}

.empty-orbit span {
  border: 1px solid rgb(216 243 91 / 70%);
  border-radius: 50%;
  height: 86px;
  left: 20px;
  position: absolute;
  top: 20px;
  width: 86px;
}

.empty-orbit span:last-child {
  height: 48px;
  left: 39px;
  top: 39px;
  width: 48px;
}

.empty-state h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
  margin: 0;
}

.empty-state p {
  color: var(--sonora-muted);
  font-size: 12px;
  margin: 10px 0 22px;
}

.discover-link {
  align-items: center;
  background: var(--sonora-accent);
  border-radius: 999px;
  color: #151810;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  gap: 8px;
  padding: 12px 17px;
  text-decoration: none;
}

@media (max-width: 640px) {
  .library-page {
    padding: 24px 20px;
  }

  h1 {
    margin-bottom: 34px;
  }

  .empty-state {
    min-height: 300px;
  }
}
</style>
