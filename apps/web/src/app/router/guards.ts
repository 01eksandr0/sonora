import type { Router } from 'vue-router'
import { useSessionStore } from '@/features/auth'
import { ROUTE_NAMES } from './routes'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    skipOnboardingCheck?: boolean
  }
}

/**
 * anonymous → landing → login/register → authenticated → onboarding → application
 */
export function registerGuards(router: Router) {
  router.beforeEach((to) => {
    const session = useSessionStore()

    if (to.meta.requiresAuth && !session.isAuthenticated) {
      return { name: ROUTE_NAMES.login, query: { redirect: to.fullPath } }
    }

    if (
      to.meta.requiresAuth &&
      session.isAuthenticated &&
      !session.onboardingCompleted &&
      !to.meta.skipOnboardingCheck
    ) {
      return { name: ROUTE_NAMES.onboarding }
    }

    return true
  })
}
