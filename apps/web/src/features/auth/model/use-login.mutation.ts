import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'
import type { LoginRequest } from '@music-app/shared-types'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from './session.store'

export function useLoginMutation() {
  const router = useRouter()
  const route = useRoute()
  const queryClient = useQueryClient()
  const session = useSessionStore()

  return useMutation({
    mutationFn: (data: LoginRequest) => api.auth.login(data),
    onSuccess: (response) => {
      session.setSession(response.user)
      queryClient.setQueryData(queryKeys.currentUser, response.user)

      const redirectPath = route.query.redirect as string | undefined

      if (redirectPath) {
        router.push(redirectPath)
      } else if (!response.user.onboardingCompleted) {
        router.push({ name: ROUTE_NAMES.onboarding })
      } else {
        router.push({ name: ROUTE_NAMES.home })
      }
    },
  })
}
