<script setup lang="ts">
import { AuthLayout } from '@/widgets/auth-layout'
import { LoginForm } from '@/features/auth'
</script>

<template>
  <AuthLayout eyebrow="Welcome back" lede="Pick up right where your sound left off.">
    <template #title> Log in to<br /><em>Sonora.</em> </template>

    <LoginForm />
  </AuthLayout>
</template>
