<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { IconArrowRight } from '@tabler/icons-vue'
import { ApiError } from '@music-app/api-client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { SonoraButton, SonoraInput } from '@/shared/ui'
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
    <SonoraInput
      id="register-name"
      name="displayName"
      v-model="displayName"
      type="text"
      label="Display name"
      placeholder="Alex"
      autocomplete="name"
      :error="displayNameError"
    />

    <SonoraInput
      id="register-email"
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
      id="register-password"
      name="password"
      v-model="password"
      type="password"
      label="Password"
      placeholder="At least 8 characters"
      autocomplete="new-password"
      :error="passwordError"
      required
    />

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
      {{ isSubmitting ? 'Working…' : 'Create account' }}
      <IconArrowRight v-if="!isSubmitting" :size="16" />
    </SonoraButton>

    <div class="auth-switch">
      Already have an account?
      <RouterLink :to="{ name: ROUTE_NAMES.login }"> Log in </RouterLink>
    </div>
  </form>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: 17px;
  width: 100%;
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
