<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconArrowRight } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useLoginMutation } from '../model/use-login.mutation'

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

const loginMutation = useLoginMutation()

async function submit() {
  error.value = ''
  pending.value = true

  try {
    await loginMutation.mutateAsync({
      email: email.value,
      password: password.value,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        error.value = 'Invalid email or password.'
      } else if (err.status === 429) {
        error.value = 'Too many attempts. Please wait a minute.'
      } else {
        const message = (err.body as { message?: string | string[] } | undefined)?.message
        error.value = (Array.isArray(message) ? message[0] : message) || 'Unable to log in.'
      }
    } else {
      error.value = 'Unable to connect to the server.'
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <label>
      Email
      <input v-model="email" type="email" placeholder="you@example.com" required />
    </label>

    <label>
      <span class="label-row">
        Password
        <RouterLink :to="{ name: ROUTE_NAMES.forgotPassword }" class="forgot-link">
          Forgot password?
        </RouterLink>
      </span>
      <input
        v-model="password"
        type="password"
        placeholder="At least 8 characters"
        minlength="8"
        required
      />
    </label>

    <p v-if="error" class="auth-error">{{ error }}</p>

    <button class="primary-button auth-submit" :disabled="pending" type="submit">
      {{ pending ? 'Working…' : 'Log in' }}
      <IconArrowRight :size="16" />
    </button>
  </form>

  <div class="auth-switch">
    New to Sonora?
    <RouterLink :to="{ name: ROUTE_NAMES.register }">Create an account</RouterLink>
  </div>
</template>

<style scoped>
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  color: var(--sonora-muted);
  text-decoration: none;
}

.forgot-link:hover {
  color: var(--sonora-accent);
}
</style>
