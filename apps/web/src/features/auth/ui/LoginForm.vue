<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { IconArrowRight } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { SonoraButton, SonoraInput } from '@/shared/ui'
import { toValidationSchema } from '@/shared/lib/validation'
import { loginSchema, type LoginFormValues } from '../model/auth.schema'
import { useLoginMutation } from '../model/use-login.mutation'

const errorMessage = ref('')
const loginMutation = useLoginMutation()

const { handleSubmit, isSubmitting } = useForm<LoginFormValues>({
  validationSchema: toValidationSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
  },
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = ''
  try {
    await loginMutation.mutateAsync(values)
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        errorMessage.value = 'Invalid email or password. Please try again.'
      } else if (err.status === 429) {
        errorMessage.value = 'Too many attempts. Please wait a minute before trying again.'
      } else {
        const message = (err.body as { message?: string | string[] } | undefined)?.message
        errorMessage.value =
          (Array.isArray(message) ? message[0] : message) ||
          'Login failed. Please check your credentials.'
      }
    } else {
      errorMessage.value = 'Unable to connect to the server. Please check your internet connection.'
    }
  }
})
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit" novalidate>
    <SonoraInput
      id="login-email"
      name="email"
      v-model="email"
      type="email"
      label="Email"
      placeholder="you@example.com"
      autocomplete="email"
      :error="emailError"
      required
    />

    <SonoraInput
      id="login-password"
      name="password"
      v-model="password"
      type="password"
      label="Password"
      placeholder="At least 8 characters"
      autocomplete="current-password"
      :error="passwordError"
      required
    >
      <template #label-extra>
        <RouterLink :to="{ name: ROUTE_NAMES.forgotPassword }" class="forgot-link">
          Forgot password?
        </RouterLink>
      </template>
    </SonoraInput>

    <p v-if="errorMessage" class="auth-error" role="alert">
      {{ errorMessage }}
    </p>

    <SonoraButton
      type="submit"
      variant="primary"
      size="md"
      full-width
      :loading="isSubmitting"
      class="auth-submit"
    >
      {{ isSubmitting ? 'Working…' : 'Log in' }}
      <IconArrowRight v-if="!isSubmitting" :size="16" />
    </SonoraButton>

    <div class="auth-switch">
      New to Sonora?
      <RouterLink :to="{ name: ROUTE_NAMES.register }"> Create an account </RouterLink>
    </div>
  </form>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: 17px;
  width: 100%;
}

.forgot-link {
  font-size: 11px;
  color: var(--sonora-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.forgot-link:hover {
  color: var(--sonora-accent);
}

.auth-submit {
  justify-content: center;
  margin-top: 8px;
  width: 100%;
}

.auth-submit:disabled {
  cursor: wait;
  opacity: 0.6;
}

.auth-error {
  color: #ee8068;
  font-size: 11px;
  margin: 0;
}

.auth-switch {
  color: var(--sonora-muted);
  font-size: 11px;
  margin-top: 25px;
  text-align: center;
}

.auth-switch a {
  color: var(--sonora-accent);
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
