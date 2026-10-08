<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { IconLock, IconMail, IconUser } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { FormAlert, SonoraButton, SonoraInput } from '@/shared/ui'
import { toValidationSchema } from '@/shared/lib/validation'
import { registerSchema, type RegisterFormValues } from '../model/auth.schema'
import { useRegisterMutation } from '../model/use-register.mutation'

const errorMessage = ref('')
const registerMutation = useRegisterMutation()

const { handleSubmit, isSubmitting } = useForm<RegisterFormValues>({
  validationSchema: toValidationSchema(registerSchema),
  initialValues: {
    displayName: '',
    email: '',
    password: '',
  },
})

const { value: displayName, errorMessage: displayNameError } = useField<string>('displayName')
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = ''
  try {
    await registerMutation.mutateAsync({
      email: values.email,
      password: values.password,
      displayName: values.displayName?.trim() || undefined,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        errorMessage.value = 'An account with this email already exists. Try logging in instead.'
      } else if (err.status === 429) {
        errorMessage.value = 'Too many registration attempts. Please wait a minute.'
      } else {
        const message = (err.body as { message?: string | string[] } | undefined)?.message
        errorMessage.value =
          (Array.isArray(message) ? message[0] : message) ||
          'Registration failed. Please check your data.'
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
      id="register-name"
      name="displayName"
      v-model="displayName"
      type="text"
      label="Display name"
      placeholder="Alex"
      hint="How you'll appear on playlists and profile"
      autocomplete="name"
      :error="displayNameError"
    >
      <template #prefix>
        <IconUser :size="16" />
      </template>
    </SonoraInput>

    <SonoraInput
      id="register-email"
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
      id="register-password"
      name="password"
      v-model="password"
      type="password"
      label="Password"
      placeholder="At least 8 characters"
      hint="Must contain at least 8 characters"
      autocomplete="new-password"
      :error="passwordError"
      required
    >
      <template #prefix>
        <IconLock :size="16" />
      </template>
    </SonoraInput>

    <SonoraButton
      type="submit"
      variant="primary"
      size="md"
      full-width
      :loading="isSubmitting || registerMutation.isPending.value"
      class="submit-button"
    >
      Create account
    </SonoraButton>

    <div class="form-footer">
      <span>Already have an account?</span>
      <RouterLink :to="{ name: ROUTE_NAMES.login }" class="switch-link"> Log in </RouterLink>
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
