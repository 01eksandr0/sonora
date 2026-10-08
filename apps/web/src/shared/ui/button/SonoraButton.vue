<script setup lang="ts">
import { IconLoader2 } from '@tabler/icons-vue'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="sonora-button"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      { 'is-loading': loading, 'full-width': fullWidth },
    ]"
    @click="emit('click', $event)"
  >
    <IconLoader2
      v-if="loading"
      class="spinner"
      :size="size === 'sm' ? 14 : size === 'lg' ? 20 : 16"
    />
    <span v-if="$slots.icon && !loading" class="button-icon">
      <slot name="icon" />
    </span>
    <span class="button-label" :class="{ 'is-hidden-loading': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.sonora-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  position: relative;
}

.full-width {
  width: 100%;
}

/* Sizes */
.size-sm {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
}

.size-md {
  height: 46px;
  padding: 0 24px;
  font-size: 13px;
  letter-spacing: -0.01em;
}

.size-lg {
  height: 52px;
  padding: 0 32px;
  font-size: 15px;
  letter-spacing: -0.01em;
}

/* Variants */
.variant-primary {
  background: var(--sonora-accent, #d8f35b);
  color: #12140e;
  box-shadow: 0 2px 12px rgba(216, 243, 91, 0.2);
}

.variant-primary:hover:not(:disabled) {
  background: #e5fc73;
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(216, 243, 91, 0.35);
}

.variant-primary:active:not(:disabled) {
  transform: translateY(0);
}

.variant-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--sonora-text);
  border-color: rgba(255, 255, 255, 0.1);
}

.variant-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
}

.variant-ghost {
  background: transparent;
  color: var(--sonora-muted);
}

.variant-ghost:hover:not(:disabled) {
  color: var(--sonora-text);
  background: rgba(255, 255, 255, 0.05);
}

.sonora-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.button-icon {
  display: flex;
  align-items: center;
}
</style>
