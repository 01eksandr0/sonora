<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IconSettings } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

const session = useSessionStore()
const displayName = computed(
  () => session.user?.profile?.displayName || session.user?.email || 'Listener',
)
const initial = computed(() => displayName.value.slice(0, 1).toUpperCase())
</script>

<template>
  <main class="profile-page">
    <RouterLink class="back-link" :to="{ name: ROUTE_NAMES.home }">← Back to Sonora</RouterLink>

    <section class="profile-hero">
      <div class="profile-avatar">{{ initial }}</div>
      <div class="profile-details">
        <p class="eyebrow">YOUR PROFILE</p>
        <h1>{{ displayName }}</h1>
        <p class="profile-email">{{ session.user?.email }}</p>
      </div>
      <RouterLink class="settings-link" :to="{ name: ROUTE_NAMES.settings }">
        <IconSettings :size="15" />
        Settings
      </RouterLink>
    </section>

    <section class="profile-card">
      <p class="eyebrow">ACCOUNT</p>
      <div>
        <span>Name</span>
        <strong>{{ displayName }}</strong>
      </div>
      <div>
        <span>Email</span>
        <strong>{{ session.user?.email }}</strong>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  color: var(--sonora-text);
  margin: 0 auto;
  max-width: 1100px;
  padding: 40px 5vw 90px;
  width: 100%;
}

.back-link {
  color: var(--sonora-muted);
  font-size: 11px;
  text-decoration: none;
}

.back-link:hover {
  color: var(--sonora-text);
}

.profile-hero {
  align-items: center;
  display: flex;
  gap: 22px;
  margin-top: 80px;
}

.profile-avatar {
  align-items: center;
  background: linear-gradient(135deg, #c87848, #6d3e40);
  border-radius: 50%;
  display: flex;
  flex: 0 0 100px;
  font-size: 25px;
  font-weight: 700;
  height: 100px;
  justify-content: center;
}

.profile-details {
  min-width: 0;
}

.eyebrow {
  color: var(--sonora-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0;
}

h1 {
  font-size: clamp(32px, 5vw, 64px);
  letter-spacing: -0.08em;
  line-height: 0.95;
  margin: 12px 0 8px;
  overflow-wrap: anywhere;
}

.profile-email {
  color: var(--sonora-muted);
  font-size: 11px;
  margin: 0;
}

.settings-link {
  align-items: center;
  color: var(--sonora-muted);
  display: inline-flex;
  font-size: 11px;
  gap: 7px;
  margin-left: auto;
  text-decoration: none;
}

.settings-link:hover {
  color: var(--sonora-text);
}

.profile-card {
  border-bottom: 1px solid #2a2a31;
  border-top: 1px solid #2a2a31;
  margin-top: 60px;
  padding: 22px 0;
}

.profile-card > .eyebrow {
  margin-bottom: 18px;
}

.profile-card > div {
  align-items: center;
  border-top: 1px solid #292930;
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
}

.profile-card span {
  color: var(--sonora-muted);
  font-size: 11px;
}

.profile-card strong {
  font-size: 12px;
  font-weight: 500;
  overflow-wrap: anywhere;
  text-align: right;
}

@media (max-width: 640px) {
  .profile-page {
    padding: 24px 20px 60px;
  }

  .profile-hero {
    align-items: flex-start;
    flex-wrap: wrap;
    margin-top: 60px;
  }

  .profile-avatar {
    flex-basis: 72px;
    font-size: 20px;
    height: 72px;
  }

  .settings-link {
    margin-left: 0;
    width: 100%;
  }

  .profile-card {
    margin-top: 40px;
  }
}
</style>
