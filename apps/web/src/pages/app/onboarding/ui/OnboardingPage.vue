
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/api/client'
import { useSessionStore } from '@/features/auth'
import { ROUTE_NAMES } from '@/app/router/routes'

const router = useRouter()
const sessionStore = useSessionStore()

const genres = ref<string[]>([])
const artists = ref<string[]>([])
const moods = ref<string[]>([])

const selectedGenres = ref<string[]>([])
const selectedArtists = ref<string[]>([])
const selectedMoods = ref<string[]>([])

const step = ref(0)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const steps = [
  {
    title: 'What pulls you in?',
    subtitle: 'Pick the genres that speak to you.',
    label: 'Genres',
  },
  {
    title: 'Who is already on repeat?',
    subtitle: 'Choose a few. You can always change your mind.',
    label: 'Artists',
  },
  {
    title: 'What should it feel like?',
    subtitle: 'Choose a few. You can always change your mind.',
    label: 'Moods',
  },
]

const currentStep = computed(() => steps[step.value]!)
const currentOptions = computed(() => {
  if (step.value === 0) return genres.value
  if (step.value === 1) return artists.value
  return moods.value
})

const currentSelection = computed(() => {
  if (step.value === 0) return selectedGenres.value
  if (step.value === 1) return selectedArtists.value
  return selectedMoods.value
})

const progress = computed(() => ((step.value + 1) / steps.length) * 100)

function toggleOption(option: string) {
  const selection = currentSelection.value
  const index = selection.indexOf(option)

  if (index === -1) {
    selection.push(option)
  } else {
    selection.splice(index, 1)
  }
}

function isSelected(option: string) {
  return currentSelection.value.includes(option)
}

function continueOnboarding() {
  errorMessage.value = ''

  if (currentSelection.value.length === 0) {
    errorMessage.value = 'Please select at least one option to continue.'
    return
  }

  if (step.value < steps.length - 1) {
    step.value++
  }
}

function goBack() {
  if (step.value > 0) {
    step.value--
    errorMessage.value = ''
  }
}

async function finishOnboarding() {
  if (selectedMoods.value.length === 0) {
    errorMessage.value = 'Please select at least one mood.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await api.onboarding.complete({
      genres: selectedGenres.value,
      artists: selectedArtists.value,
      moods: selectedMoods.value,
    })

    sessionStore.onboardingCompleted = true

    if (sessionStore.user) {
      sessionStore.user.onboardingCompleted = true
    }

    await router.push({ name: ROUTE_NAMES.home })
  } catch {
    errorMessage.value = 'Could not save your preferences. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    const options = await api.onboarding.getOptions()
    genres.value = options.genres
    artists.value = options.artists
    moods.value = options.moods
  } catch {
    errorMessage.value = 'Could not load onboarding options. Please refresh the page.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="onboarding">
<header class="onboarding__header">
  <RouterLink to="/" class="onboarding__logo">
    <span>so</span><span class="onboarding__logo-white">nora</span>
  </RouterLink>

  <span class="onboarding__step">
   {{ step + 1 }} / {{ steps.length }}
  </span>
</header>

    <section class="onboarding__content">
      <div class="onboarding__progress">
        <div
          class="onboarding__progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <template v-if="isLoading">
        <p class="onboarding__status">Loading your choices...</p>
      </template>

      <template v-else>
        <div class="onboarding__intro">
          <p class="onboarding__eyebrow">Your listening profile</p>
          <h1>{{ currentStep.title }}</h1>
          <p class="onboarding__subtitle">{{ currentStep.subtitle }}</p>
        </div>

        <div class="taste-grid">
          <button
            v-for="option in currentOptions"
            :key="option"
            type="button"
            class="taste-option"
            :class="{ 'taste-option--selected': isSelected(option) }"
            :aria-pressed="isSelected(option)"
            @click="toggleOption(option)"
          >
            <span>{{ option }}</span>
            <span v-if="isSelected(option)" class="taste-option__check">✓</span>
          </button>
        </div>

        <p v-if="errorMessage" class="onboarding__error" role="alert">
          {{ errorMessage }}
        </p>

        <footer class="onboarding__footer">
          <button
            v-if="step > 0"
            type="button"
            class="onboarding__back"
            @click="goBack"
          >
           <span aria-hidden="true">‹</span>
            Back
          </button>
          <span v-else />

          <button
            v-if="step < steps.length - 1"
            type="button"
            class="onboarding__next"
            :disabled="currentSelection.length === 0"
            @click="continueOnboarding"
          >
            Continue <span aria-hidden="true">→</span>
          </button>

          <button
            v-else
            type="button"
            class="onboarding__next"
            :disabled="selectedMoods.length === 0 || isSubmitting"
            @click="finishOnboarding"
          >
            {{ isSubmitting ? 'Saving...' : 'Start listening' }}
            <span v-if="!isSubmitting" aria-hidden="true">→</span>
          </button>
        </footer>
      </template>
    </section>
  </main>
</template>

<style scoped>
.onboarding {
  min-height: 100vh;
  padding: 0 clamp(20px, 5vw, 64px) 48px;
  background: var(--sonora-bg, #0e0e13);
  color: var(--sonora-text, #f5f5f5);
}

.onboarding__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 920px;
  margin: 0 auto;
  padding: 30px 0;
}

.onboarding__logo {
  color: var(--sonora-text, #f5f5f5);
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -1.5px;
  text-decoration: none;
}

.onboarding__logo-white {
  color: var(--sonora-accent, #cde43d);
}

.onboarding__step,
.onboarding__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.onboarding__step {
  color: var(--sonora-muted, #999);
}

.onboarding__content {
  width: 100%;
  max-width: 720px;
  margin: 7vh auto 0;
}

.onboarding__progress {
  height: 3px;
  margin-bottom: 65px;
  background: #292930;
}

.onboarding__progress-fill {
  height: 100%;
  background: var(--sonora-accent, #cde43d);
  transition: width 250ms ease;
}

.onboarding__intro {
  margin-bottom: 32px;
}

.onboarding__eyebrow {
  margin: 0 0 14px;
  color: var(--sonora-accent, #cde43d);
}

.onboarding__intro h1 {
  margin: 14px 0 10px;
  font-size: clamp(38px, 6vw, 70px);
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.onboarding__subtitle {
  margin: 14px 0 0;
  color: var(--sonora-muted, #999);
  font-size: 12px;
  line-height: 1.7;
}

.taste-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 43px;
}

.taste-option {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 17px;
  border: 1px solid #292930;
  border-radius: 9px;
  background: #15151b;
  color: var(--sonora-text, #f5f5f5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
}

.taste-option:hover {
  border-color: #55555f;
  background: #1c1c24;
}

.taste-option--selected {
  border-color: var(--sonora-accent, #cde43d);
  background: #22252a;
}

.taste-option__check {
  flex-shrink: 0;
  color: var(--sonora-accent, #cde43d);
  font-size: 17px;
  font-weight: 700;
}

.onboarding__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 40px;
}

.onboarding__back,
.onboarding__next {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
}

.onboarding__back {
  border: none;
  background: transparent;
  color: var(--sonora-muted, #999);
}

.onboarding__back:hover {
  color: var(--sonora-text, #f5f5f5);
}

.onboarding__back span {
  font-size: 18px;
  line-height: 1;
}

.onboarding__next {
  gap: 8px;
  margin-left: auto;
  padding: 0 20px;
  border: 1px solid var(--sonora-accent, #cde43d);
  border-radius: 999px;
  background: var(--sonora-accent, #cde43d);
  color: #151515;
  text-decoration: none;
}

.onboarding__next:hover:not(:disabled) {
  opacity: 0.88;
}

.onboarding__next:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.taste-option:focus-visible,
.onboarding__back:focus-visible,
.onboarding__next:focus-visible {
  outline: 2px solid var(--sonora-accent, #cde43d);
  outline-offset: 3px;
}

.onboarding__error {
  margin: 20px 0 0;
  color: #ff8c8c;
  font-size: 13px;
}

.onboarding__status {
  padding: 60px 0;
  color: var(--sonora-muted, #999);
  text-align: center;
}

@media (max-width: 520px) {
  .onboarding {
    padding: 0 18px 36px;
  }

  .onboarding__header {
    padding: 24px 0;
  }

  .onboarding__content {
    margin-top: 4vh;
  }

  .onboarding__progress {
    margin-bottom: 44px;
  }

  .onboarding__intro h1 {
    font-size: clamp(36px, 10vw, 48px);
  }

  .taste-grid {
    grid-template-columns: 1fr;
    margin-top: 32px;
  }

  .taste-option {
    min-height: 54px;
  }

  .onboarding__footer {
    margin-top: 32px;
  }
}
</style>