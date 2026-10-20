<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconArrowRight } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useRegisterMutation } from '../model/use-register.mutation'

const displayName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

const registerMutation = useRegisterMutation()

async function submit() {
  error.value = ''
  pending.value = true

  try {
    await registerMutation.mutateAsync({
      displayName: displayName.value.trim() || undefined,
      email: email.value,
      password: password.value,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        error.value = 'An account with this email already exists.'
      } else if (err.status === 429) {
        error.value = 'Too many attempts. Please wait a minute.'
      } else {
        const message = (err.body as { message?: string | string[] } | undefined)?.message
        error.value = (Array.isArray(message) ? message[0] : message) || 'Registration failed.'
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
      Display name
      <input v-model="displayName" type="text" placeholder="Alex" />
    </label>

    <label>
      Email
      <input v-model="email" type="email" placeholder="you@example.com" required />
    </label>

    <label>
      Password
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
      {{ pending ? 'Working…' : 'Create account' }}
      <IconArrowRight :size="16" />
    </button>
  </form>

  <div class="auth-switch">
    Already have an account?
    <RouterLink :to="{ name: ROUTE_NAMES.login }">Log in</RouterLink>
  </div>
</template>
