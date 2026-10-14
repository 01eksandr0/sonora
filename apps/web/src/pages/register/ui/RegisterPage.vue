<script setup lang="ts">
import { AuthLayout } from '@/widgets/auth-layout'
import { RegisterForm } from '@/features/auth'
</script>

<template>
  <AuthLayout
    eyebrow="A new way to listen"
    lede="Create an account to tune into music curated for the way you actually listen."
  >
    <template #title> Start listening to<br /><em>your sound.</em> </template>

    <RegisterForm />
  </AuthLayout>
</template>
