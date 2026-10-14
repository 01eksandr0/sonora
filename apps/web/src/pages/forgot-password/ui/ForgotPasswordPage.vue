<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconMail } from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'
import { AuthLayout } from '@/widgets/auth-layout'
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
  <AuthLayout
    eyebrow="Password recovery"
    lede="Enter the email associated with your account and we'll send you recovery instructions."
    :back-to="{ name: ROUTE_NAMES.login }"
    back-text="Back to login"
  >
    <template #title> Reset your<br /><em>password.</em> </template>

    <div v-if="isSubmitted" class="success-box">
      <FormAlert type="success">
        If an account with <strong>{{ email }}</strong> exists, recovery instructions have been
        sent.
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
  </AuthLayout>
</template>

<style scoped>
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
</style>
