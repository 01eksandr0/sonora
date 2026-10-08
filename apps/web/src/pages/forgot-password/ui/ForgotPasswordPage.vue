<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconArrowLeft, IconMail } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { FormAlert, SonoraButton, SonoraInput } from '@/shared/ui'

const email = ref('')
const isSubmitted = ref(false)
const isLoading = ref(false)

function handleSubmit() {
  if (!email.value) return
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    isSubmitted.value = true
  }, 400)
}
</script>

<template>
  <div class="auth-page">
    <header class="auth-nav">
      <RouterLink class="brand-mark" :to="{ name: ROUTE_NAMES.landing }">
        <span>so</span>nora
      </RouterLink>

      <RouterLink class="back-link" :to="{ name: ROUTE_NAMES.login }">
        <IconArrowLeft :size="15" />
        Back to login
      </RouterLink>
    </header>

    <main class="auth-main">
      <div class="auth-container">
        <div class="auth-card">
          <div class="card-header">
            <span class="eyebrow accent-text">Password recovery</span>
            <h1>Reset your<br /><em>password.</em></h1>
            <p class="auth-lede">
              Enter the email associated with your account and we'll send you recovery instructions.
            </p>
          </div>

          <div v-if="isSubmitted" class="success-box">
            <FormAlert type="success">
              If an account with <strong>{{ email }}</strong> exists, recovery instructions have
              been sent.
            </FormAlert>
            <RouterLink :to="{ name: ROUTE_NAMES.login }" class="return-button">
              Return to log in
            </RouterLink>
          </div>

          <form v-else class="auth-form" @submit.prevent="handleSubmit">
            <SonoraInput
              id="reset-email"
              name="email"
              v-model="email"
              type="email"
              label="Account email"
              placeholder="listener@sonora.fm"
              autocomplete="email"
              required
            >
              <template #prefix>
                <IconMail :size="16" />
              </template>
            </SonoraInput>

            <SonoraButton
              type="submit"
              variant="primary"
              size="md"
              full-width
              :loading="isLoading"
              class="submit-button"
            >
              Send reset link
            </SonoraButton>

            <div class="form-footer">
              <RouterLink :to="{ name: ROUTE_NAMES.login }" class="switch-link">
                Remember your password? Log in
              </RouterLink>
            </div>
          </form>
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

.card-header h1 em {
  color: var(--sonora-accent);
  font-style: normal;
}

.auth-lede {
  color: var(--sonora-muted);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.submit-button {
  margin-top: 6px;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--sonora-muted);
  margin-top: 8px;
}

.switch-link {
  color: var(--sonora-accent);
  text-decoration: none;
  font-weight: 600;
}

.switch-link:hover {
  text-decoration: underline;
}

.success-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.return-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 24px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--sonora-text);
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s ease;
}

.return-button:hover {
  background: rgba(255, 255, 255, 0.14);
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
