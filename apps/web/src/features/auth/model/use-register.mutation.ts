import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import type { RegisterRequest } from '@music-app/shared-types'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from './session.store'

export function useRegisterMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = useSessionStore()

  return useMutation({
    mutationFn: (data: RegisterRequest) => api.auth.register(data),
    onSuccess: (response) => {
      session.setSession(response.user)
      queryClient.setQueryData(queryKeys.currentUser, response.user)
      router.push({ name: ROUTE_NAMES.onboarding })
    },
  })
}
