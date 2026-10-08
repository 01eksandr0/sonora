<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { IconLock, IconMail } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { FormAlert, SonoraButton, SonoraInput } from '@/shared/ui'
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
    <FormAlert v-if="errorMessage" type="error" :message="errorMessage" />

    <SonoraInput
      id="login-email"
      name="email"
      v-model="email"
      type="email"
      label="Email"
      placeholder="listener@sonora.fm"
      autocomplete="email"
      :error="emailError"
      required
    >
      <template #prefix>
        <IconMail :size="16" />
      </template>
    </SonoraInput>

    <SonoraInput
      id="login-password"
      name="password"
      v-model="password"
      type="password"
      label="Password"
      placeholder="••••••••"
      autocomplete="current-password"
      :error="passwordError"
      required
    >
      <template #prefix>
        <IconLock :size="16" />
      </template>
      <template #label-extra>
        <RouterLink :to="{ name: ROUTE_NAMES.forgotPassword }" class="forgot-link">
          Forgot password?
        </RouterLink>
      </template>
    </SonoraInput>

    <SonoraButton
      type="submit"
      variant="primary"
      size="md"
      full-width
      :loading="isSubmitting || loginMutation.isPending.value"
      class="submit-button"
    >
      Log in
    </SonoraButton>

    <div class="form-footer">
      <span>Don't have an account?</span>
      <RouterLink :to="{ name: ROUTE_NAMES.register }" class="switch-link">
        Start listening
      </RouterLink>
    </div>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.submit-button {
  margin-top: 6px;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sonora-muted);
  margin-top: 8px;
}

.switch-link {
  color: var(--sonora-accent);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.switch-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}
</style>
