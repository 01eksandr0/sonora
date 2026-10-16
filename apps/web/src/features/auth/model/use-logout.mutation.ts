import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { api } from '@/shared/api/client'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from './session.store'

export function useLogoutMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = useSessionStore()

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      session.clear()
      queryClient.clear()
      router.push({ name: ROUTE_NAMES.login })
    },
    onError: () => {
      // Even if API call fails, clear client state and redirect
      session.clear()
      queryClient.clear()
      router.push({ name: ROUTE_NAMES.login })
    },
  })
}
