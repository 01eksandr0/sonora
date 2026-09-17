import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionStore } from './session.store'

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts anonymous', () => {
    const store = useSessionStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.onboardingCompleted).toBe(false)
  })

  it('becomes authenticated after setSession', () => {
    const store = useSessionStore()
    store.setSession({ id: '1', email: 'a@b.c', createdAt: '', updatedAt: '' }, true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.onboardingCompleted).toBe(true)
  })
})
