<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="public-layout">
    <main class="public-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.public-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
