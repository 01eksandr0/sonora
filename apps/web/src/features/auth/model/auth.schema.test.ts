import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth.schema'

describe('auth.schema', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'listener@sonora.fm',
        password: 'Password123!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('email')
      }
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'listener@sonora.fm',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('validates valid registration values', () => {
      const result = registerSchema.safeParse({
        displayName: 'Nova',
        email: 'nova@sonora.fm',
        password: 'Password123!',
      })
      expect(result.success).toBe(true)
    })

    it('allows empty or omitted displayName', () => {
      const result = registerSchema.safeParse({
        email: 'nova@sonora.fm',
        password: 'Password123!',
      })
      expect(result.success).toBe(true)

      const resultWithEmpty = registerSchema.safeParse({
        displayName: '',
        email: 'nova@sonora.fm',
        password: 'Password123!',
      })
      expect(resultWithEmpty.success).toBe(true)
    })

    it('rejects passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'nova@sonora.fm',
        password: 'short',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('8 characters')
      }
    })
  })
})
