import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionStore } from './session.store'

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts anonymous and uninitialized', () => {
    const store = useSessionStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.onboardingCompleted).toBe(false)
    expect(store.isInitialized).toBe(false)
    expect(store.user).toBeNull()
  })

  it('becomes authenticated after setSession with profile', () => {
    const store = useSessionStore()
    store.setSession(
      {
        id: 'user-1',
        email: 'nova@sonora.fm',
        onboardingCompleted: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        profile: {
          id: 'prof-1',
          userId: 'user-1',
          displayName: 'Nova',
          avatarUrl: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      },
      true,
    )

    expect(store.isAuthenticated).toBe(true)
    expect(store.onboardingCompleted).toBe(true)
    expect(store.user?.email).toBe('nova@sonora.fm')
    expect(store.user?.profile?.displayName).toBe('Nova')
  })

  it('clears session on clear()', () => {
    const store = useSessionStore()
    store.setSession(
      {
        id: 'user-1',
        email: 'nova@sonora.fm',
        onboardingCompleted: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        profile: null,
      },
      false,
    )
    expect(store.isAuthenticated).toBe(true)

    store.clear()
    expect(store.isAuthenticated).toBe(false)
    expect(store.onboardingCompleted).toBe(false)
    expect(store.user).toBeNull()
  })
})
