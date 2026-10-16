<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconEye, IconEyeOff } from '@tabler/icons-vue'

interface Props {
  modelValue?: string | number
  id?: string
  name?: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  id: () => `input-${Math.random().toString(36).substring(2, 9)}`,
  name: '',
  label: '',
  type: 'text',
  placeholder: '',
  error: '',
  hint: '',
  disabled: false,
  required: false,
  autocomplete: 'off',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const isPasswordVisible = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="sonora-input-group" :class="{ 'has-error': Boolean(error), 'is-disabled': disabled }">
    <div v-if="label" class="label-row">
      <label :for="id" class="sonora-label">
        {{ label }}
        <span v-if="required" class="required-mark" aria-hidden="true">*</span>
      </label>
      <slot name="label-extra" />
    </div>

    <div class="input-wrapper">
      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </span>

      <input
        :id="id"
        :name="name || id"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        class="sonora-input"
        :class="{
          'has-prefix': Boolean($slots.prefix),
          'has-suffix': Boolean($slots.suffix) || type === 'password',
        }"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <div class="input-suffix">
        <button
          v-if="type === 'password'"
          type="button"
          class="password-toggle"
          :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
          tabindex="-1"
          @click="togglePasswordVisibility"
        >
          <IconEyeOff v-if="isPasswordVisible" :size="18" />
          <IconEye v-else :size="18" />
        </button>
        <slot v-else name="suffix" />
      </div>
    </div>

    <p v-if="error" :id="`${id}-error`" class="error-text" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="hint-text">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.sonora-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sonora-label {
  font-size: 11px;
  font-weight: 500;
  color: #b6b6bc;
  letter-spacing: -0.01em;
}

.required-mark {
  color: var(--sonora-accent);
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #15151b;
  border: 1px solid #2b2b33;
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.input-wrapper:hover:not(.is-disabled) {
  border-color: #3d3d48;
}

.input-wrapper:focus-within {
  border-color: var(--sonora-accent);
}

.has-error .input-wrapper {
  border-color: #ee8068;
}

.is-disabled .input-wrapper {
  opacity: 0.5;
  cursor: not-allowed;
}

.sonora-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--sonora-text);
  font-size: 13px;
  font-family: inherit;
}

.sonora-input::placeholder {
  color: var(--sonora-muted);
  opacity: 0.7;
}

.sonora-input.has-prefix {
  padding-left: 42px;
}

.sonora-input.has-suffix {
  padding-right: 44px;
}

.input-prefix {
  position: absolute;
  left: 14px;
  display: flex;
  align-items: center;
  color: var(--sonora-muted);
  pointer-events: none;
}

.input-suffix {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
}

.password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--sonora-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.password-toggle:hover {
  color: var(--sonora-text);
}

.error-text {
  margin: 0;
  font-size: 11px;
  color: #ee8068;
  line-height: 1.3;
}

.hint-text {
  margin: 0;
  font-size: 11px;
  color: var(--sonora-muted);
  line-height: 1.3;
}
</style>
