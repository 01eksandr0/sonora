import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserWithProfile } from '@music-app/shared-types'
import { api } from '@/shared/api/client'

/**
 * Client-side session state. Manages user authentication status,
 * onboarding completion flag, and handles initial session restoration
 * via the GET /api/auth/me endpoint.
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<UserWithProfile | null>(null)
  const onboardingCompleted = ref(false)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function setSession(
    nextUser: (UserWithProfile & { onboardingCompleted?: boolean }) | null,
    completed?: boolean,
  ) {
    user.value = nextUser as UserWithProfile | null
    if (completed !== undefined) {
      onboardingCompleted.value = completed
    } else if (nextUser && 'onboardingCompleted' in nextUser) {
      onboardingCompleted.value = Boolean(nextUser.onboardingCompleted)
    } else {
      onboardingCompleted.value = false
    }
  }

  async function initSession(): Promise<UserWithProfile | null> {
    if (isInitialized.value) return user.value

    isLoading.value = true
    try {
      const currentUser = await api.auth.me()
      setSession(currentUser)
      return currentUser
    } catch {
      setSession(null, false)
      return null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  function clear() {
    setSession(null, false)
  }

  return {
    user,
    onboardingCompleted,
    isInitialized,
    isLoading,
    isAuthenticated,
    setSession,
    initSession,
    clear,
  }
})
