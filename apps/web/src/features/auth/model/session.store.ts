import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserWithProfile } from '@music-app/shared-types'
import { api } from '@/shared/api/client'
import { ApiError } from '@music-app/api-client'

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
      let currentUser: UserWithProfile

      try {
        currentUser = await api.auth.me()
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error
        }

        await api.auth.refresh()

        currentUser = await api.auth.me()
      }

      setSession(currentUser)
      return currentUser
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setSession(null, false)
        return null
      }

      // A network error or server error does not prove the session expired.
      throw error
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
