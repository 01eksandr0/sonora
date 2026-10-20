<script setup lang="ts">
import { IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-vue'

interface Props {
  type?: 'error' | 'success' | 'info'
  message?: string
}

withDefaults(defineProps<Props>(), {
  type: 'error',
  message: '',
})
</script>

<template>
  <div v-if="message || $slots.default" class="form-alert" :class="`alert-${type}`" role="alert">
    <div class="alert-icon">
      <IconAlertCircle v-if="type === 'error'" :size="18" />
      <IconCheck v-else-if="type === 'success'" :size="18" />
      <IconInfoCircle v-else :size="18" />
    </div>
    <div class="alert-content">
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<style scoped>
.form-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
  animation: fadeIn 0.2s ease-out;
}

.alert-error {
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff9b9b;
}

.alert-error .alert-icon {
  color: #ff6b6b;
}

.alert-success {
  background: rgba(216, 243, 91, 0.12);
  border: 1px solid rgba(216, 243, 91, 0.3);
  color: #d8f35b;
}

.alert-info {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--sonora-text);
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 1px;
}

.alert-content {
  flex: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
