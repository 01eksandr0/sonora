<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { IconArrowLeft } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'

interface Props {
  eyebrow?: string
  title?: string
  lede?: string
  backTo?: RouteLocationRaw
  backText?: string
}

withDefaults(defineProps<Props>(), {
  eyebrow: '',
  title: '',
  lede: '',
  backTo: () => ({ name: ROUTE_NAMES.landing }),
  backText: 'Back to home',
})
</script>

<template>
  <div class="auth-page">
    <header class="auth-nav">
      <RouterLink class="brand-mark" :to="{ name: ROUTE_NAMES.landing }">
        <span>so</span>nora
      </RouterLink>

      <RouterLink class="back-link" :to="backTo">
        <IconArrowLeft :size="15" />
        {{ backText }}
      </RouterLink>
    </header>

    <main class="auth-main">
      <div class="auth-container">
        <div class="auth-card">
          <div class="card-header">
            <span v-if="eyebrow" class="eyebrow accent-text">{{ eyebrow }}</span>

            <h1>
              <slot name="title">{{ title }}</slot>
            </h1>

            <p v-if="lede" class="auth-lede">{{ lede }}</p>
          </div>

          <slot />
        </div>
      </div>
    </main>

    <footer class="auth-footer">
      <span>sonora © 2026</span>
      <span>Listen closer.</span>
    </footer>
  </div>
</template>

<style scoped>
.auth-page {
  background: var(--sonora-bg, #0b0b0f);
  color: var(--sonora-text, #f2f1ed);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.auth-page::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -100px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(216, 243, 91, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 5vw;
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--sonora-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: var(--sonora-text);
}

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 5vw 60px;
  position: relative;
  z-index: 1;
}

.auth-container {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  background: var(--sonora-surface, #17171e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(16px);
}

.card-header {
  margin-bottom: 28px;
}

.card-header h1 {
  font-size: clamp(32px, 5vw, 42px);
  letter-spacing: -0.05em;
  line-height: 1.05;
  margin: 12px 0 10px;
}

.card-header :deep(em) {
  color: var(--sonora-accent);
  font-style: normal;
}

.auth-lede {
  color: var(--sonora-muted);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  padding: 20px 5vw;
  font-size: 11px;
  color: var(--sonora-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
}

@media (max-width: 520px) {
  .auth-card {
    padding: 28px 20px;
    border-radius: 20px;
  }

  .card-header h1 {
    font-size: 32px;
  }
}
</style>
