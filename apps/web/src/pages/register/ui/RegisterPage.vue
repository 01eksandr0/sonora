<script setup lang="ts">
import { AuthLayout } from '@/widgets/auth-layout'
import { RegisterForm } from '@/features/auth'
</script>

<template>
  <AuthLayout
    eyebrow="Begin your profile"
    lede="Create an account and let your taste lead the way."
  >
    <template #title> Make it yours. </template>

    <RegisterForm />
  </AuthLayout>
</template>
