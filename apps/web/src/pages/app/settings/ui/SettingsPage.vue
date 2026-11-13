<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { IconChevronRight, IconMusic, IconUser } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const session = useSessionStore()
</script>

<template>
  <main class="settings-page">
    <p class="eyebrow">ACCOUNT</p>
    <h1>Settings</h1>

    <div class="settings-layout">
      <nav class="settings-nav" aria-label="Settings sections">
        <a class="active" href="#general">General</a>
        <a href="#music-preferences">Music preferences</a>
      </nav>

      <div class="settings-list">
        <section id="general" class="settings-row">
          <span class="settings-icon"><IconUser :size="18" /></span>
          <div>
            <strong>Account</strong>
            <span>{{ session.user?.email }}</span>
          </div>
          <RouterLink :to="{ name: ROUTE_NAMES.profile }">
            Profile <IconChevronRight :size="15" />
          </RouterLink>
        </section>

        <section id="music-preferences" class="settings-row">
          <span class="settings-icon"><IconMusic :size="18" /></span>
          <div>
            <strong>Music preferences</strong>
            <span>Chosen during onboarding</span>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.settings-page {
  color: var(--sonora-text);
  margin: 0 auto;
  max-width: 1000px;
  padding: 44px 5vw 90px;
  width: 100%;
}

.eyebrow {
  color: var(--sonora-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0;
}

h1 {
  font-size: clamp(42px, 6vw, 75px);
  letter-spacing: -0.08em;
  line-height: 0.9;
  margin: 14px 0 8px;
}

.settings-layout {
  display: grid;
  gap: 64px;
  grid-template-columns: 180px 1fr;
  margin-top: 60px;
}

.settings-nav {
  align-content: start;
  display: grid;
  gap: 20px;
}

.settings-nav a {
  color: var(--sonora-muted);
  font-size: 12px;
  text-decoration: none;
}

.settings-nav .active {
  color: var(--sonora-accent);
}

.settings-list {
  border-top: 1px solid #292930;
}

.settings-row {
  align-items: center;
  border-bottom: 1px solid #292930;
  display: flex;
  gap: 14px;
  padding: 19px 0;
}

.settings-icon {
  align-items: center;
  background: #1c1c23;
  border-radius: 8px;
  color: var(--sonora-accent);
  display: flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
}

.settings-row strong,
.settings-row span {
  display: block;
}

.settings-row strong {
  font-size: 12px;
}

.settings-row div span {
  color: var(--sonora-muted);
  font-size: 10px;
  margin-top: 4px;
}

.settings-row a {
  align-items: center;
  color: var(--sonora-muted);
  display: flex;
  font-size: 10px;
  gap: 5px;
  margin-left: auto;
  text-decoration: none;
}

.settings-row a:hover {
  color: var(--sonora-text);
}

@media (max-width: 640px) {
  .settings-page {
    padding: 24px 20px 60px;
  }

  .settings-layout {
    display: block;
    margin-top: 40px;
  }

  .settings-nav {
    display: flex;
    gap: 17px;
    margin-bottom: 35px;
    overflow-x: auto;
  }

  .settings-nav a {
    white-space: nowrap;
  }
}
</style>
