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
  backText: 'Back to Sonora',
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-visual">
      <RouterLink class="brand-mark" :to="{ name: ROUTE_NAMES.landing }">
        <span>so</span>nora
      </RouterLink>

      <div class="auth-visual-art">
        <div class="landing-orbit orbit-large" />
        <div class="landing-orbit orbit-mid" />
        <div class="landing-visual-disc">
          <span>SO</span>
        </div>
      </div>

      <p>
        Listen closer.<br />
        <em>Discover further.</em>
      </p>
    </div>

    <div class="auth-panel">
      <RouterLink class="auth-back" :to="backTo">
        <IconArrowLeft :size="15" />
        {{ backText }}
      </RouterLink>

      <div class="auth-form-wrap">
        <p v-if="eyebrow" class="eyebrow accent-text">{{ eyebrow }}</p>

        <h1>
          <slot name="title">{{ title }}</slot>
        </h1>

        <p v-if="lede" class="auth-intro">{{ lede }}</p>

        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  background: var(--sonora-bg, #0b0b0f);
  color: var(--sonora-text, #f2f1ed);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  min-height: 100vh;
}

.auth-visual {
  background: #24362c;
  overflow: hidden;
  padding: 32px 5vw;
  position: relative;
}

.auth-visual .brand-mark {
  margin: 0;
  position: relative;
  z-index: 3;
}

.auth-visual-art {
  height: min(42vw, 520px);
  position: absolute;
  right: 6%;
  top: 19%;
  width: min(42vw, 520px);
}

.auth-visual-art::after {
  background: var(--sonora-accent, #d8f35b);
  border-radius: 50%;
  content: '';
  height: 26%;
  left: 37%;
  position: absolute;
  top: 37%;
  width: 26%;
}

.auth-visual-art .landing-visual-disc {
  display: none;
}

.landing-orbit {
  border: 1px solid rgba(233, 241, 193, 0.58);
  border-radius: 50%;
  position: absolute;
  z-index: 1;
}

.orbit-large {
  height: 94%;
  left: 3%;
  top: 3%;
  width: 94%;
}

.orbit-mid {
  height: 67%;
  left: 16%;
  top: 16%;
  width: 67%;
}

.auth-visual p {
  bottom: 10%;
  font-size: 34px;
  letter-spacing: -0.06em;
  line-height: 0.95;
  position: absolute;
  margin: 0;
}

.auth-visual p em,
.auth-visual p :deep(em) {
  color: var(--sonora-accent, #d8f35b);
  font-style: normal;
}

.auth-panel {
  padding: 32px 8vw;
}

.auth-back {
  align-items: center;
  color: var(--sonora-muted);
  display: inline-flex;
  font-size: 11px;
  gap: 8px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.auth-back:hover {
  color: var(--sonora-text);
}

.auth-form-wrap {
  margin: 17vh auto 0;
  max-width: 380px;
}

.auth-form-wrap h1 {
  font-size: clamp(40px, 5vw, 64px);
  letter-spacing: -0.08em;
  line-height: 0.9;
  margin: 16px 0;
}

.auth-form-wrap h1 :deep(em) {
  color: var(--sonora-accent, #d8f35b);
  font-style: normal;
}

.auth-intro {
  color: var(--sonora-muted);
  font-size: 12px;
  margin-bottom: 35px;
}

.auth-form-wrap :deep(form) {
  display: grid;
  gap: 17px;
}

.auth-form-wrap :deep(label) {
  color: #b6b6bc;
  display: grid;
  font-size: 11px;
  gap: 8px;
}

.auth-form-wrap :deep(input) {
  background: #15151b;
  border: 1px solid #2b2b33;
  border-radius: 8px;
  color: var(--sonora-text);
  outline: 0;
  padding: 13px;
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.15s ease;
}

.auth-form-wrap :deep(input:focus) {
  border-color: var(--sonora-accent);
}

.auth-form-wrap :deep(.auth-submit) {
  justify-content: center;
  margin-top: 8px;
  width: 100%;
}

.auth-form-wrap :deep(.auth-submit:disabled) {
  cursor: wait;
  opacity: 0.6;
}

.auth-form-wrap :deep(.auth-error) {
  color: #ee8068;
  font-size: 11px;
  margin: 0;
}

.auth-form-wrap :deep(.auth-switch) {
  color: var(--sonora-muted);
  font-size: 11px;
  margin-top: 25px;
  text-align: center;
}

.auth-form-wrap :deep(.auth-switch a) {
  color: var(--sonora-accent);
  text-decoration: none;
}

.auth-form-wrap :deep(.auth-switch a:hover) {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .auth-page {
    display: block;
  }
  .auth-visual {
    min-height: 260px;
    padding: 25px 5vw;
  }
  .auth-visual-art {
    height: 230px;
    right: -5%;
    top: 12%;
    width: 230px;
  }
  .auth-visual p {
    bottom: 25px;
    font-size: 25px;
  }
  .auth-panel {
    padding: 25px 8vw 50px;
  }
  .auth-form-wrap {
    margin-top: 70px;
  }
}
</style>
