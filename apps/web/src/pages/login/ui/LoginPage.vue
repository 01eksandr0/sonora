<script setup lang="ts">
import { AuthLayout } from '@/widgets/auth-layout'
import { LoginForm } from '@/features/auth'
</script>

<template>
  <AuthLayout eyebrow="Welcome back" lede="Pick up where your listening left off.">
    <template #title> Good to see you. </template>

    <LoginForm />
  </AuthLayout>
</template>
