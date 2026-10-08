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
 * Navigation lifecycle:
 * anonymous → landing → login/register → authenticated → onboarding → application
 */
export function registerGuards(router: Router) {
  router.beforeEach(async (to) => {
    const session = useSessionStore()

    // 1. Initial hydration of session from HttpOnly cookies via GET /api/auth/me
    if (!session.isInitialized) {
      await session.initSession()
    }

    // 2. Prevent authenticated users from visiting login or register pages
    if (
      session.isAuthenticated &&
      (to.name === ROUTE_NAMES.login || to.name === ROUTE_NAMES.register)
    ) {
      if (!session.onboardingCompleted) {
        return { name: ROUTE_NAMES.onboarding }
      }
      return { name: ROUTE_NAMES.home }
    }

    // 3. Protected routes requirement
    if (to.meta.requiresAuth && !session.isAuthenticated) {
      return {
        name: ROUTE_NAMES.login,
        query: { redirect: to.fullPath !== '/app' ? to.fullPath : undefined },
      }
    }

    // 4. Force onboarding for new users entering protected routes
    if (
      to.meta.requiresAuth &&
      session.isAuthenticated &&
      !session.onboardingCompleted &&
      !to.meta.skipOnboardingCheck
    ) {
      return { name: ROUTE_NAMES.onboarding }
    }

    // 5. If onboarding is already completed, prevent re-entering onboarding page
    if (
      to.name === ROUTE_NAMES.onboarding &&
      session.isAuthenticated &&
      session.onboardingCompleted
    ) {
      return { name: ROUTE_NAMES.home }
    }

    return true
  })
}
