import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/entities/user'

/**
 * Client-side session state. The actual user is fetched via TanStack Query
 * (`current user`) once the auth API exists; this store only mirrors what the
 * router needs synchronously.
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const onboardingCompleted = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function setSession(nextUser: User | null, completed = false) {
    user.value = nextUser
    onboardingCompleted.value = completed
  }

  function clear() {
    setSession(null, false)
  }

  return { user, onboardingCompleted, isAuthenticated, setSession, clear }
})
