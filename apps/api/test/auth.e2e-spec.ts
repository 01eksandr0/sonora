import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { AuthResponse, UserWithProfile } from '@music-app/shared-types'
import cookieParser from 'cookie-parser'
import type { Server } from 'node:http'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js'

interface ErrorResponseBody {
  statusCode: number
  error: string
  message: string | string[]
  path: string
  timestamp: string
}

describe('Auth API (e2e)', () => {
  let app: INestApplication
  const testEmail = `auth-test-${Date.now()}@example.com`
  const testPassword = 'Password123!'
  const testDisplayName = 'Test User'

  let accessTokenCookie: string
  let refreshTokenCookie: string
  let bearerToken: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/register', () => {
    it('rejects registration with short password', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: '123',
        })
        .expect(400)

      const body = response.body as ErrorResponseBody
      expect(body.message).toBeDefined()
    })

    it('rejects registration with invalid email format', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: testPassword,
        })
        .expect(400)

      const body = response.body as ErrorResponseBody
      expect(body.message).toBeDefined()
    })

    it('successfully registers a new user with cookies and body', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          displayName: testDisplayName,
        })
        .expect(201)

      const body = response.body as AuthResponse
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe(testEmail.toLowerCase())
      expect(body.user.profile?.displayName).toBe(testDisplayName)
      expect(body.accessToken).toBeDefined()
      expect((body.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined()

      const cookies = response.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true)
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true)

      // Save for subsequent tests
      bearerToken = body.accessToken
      accessTokenCookie = cookies.find((c) => c.startsWith('access_token='))!.split(';')[0]!
      refreshTokenCookie = cookies.find((c) => c.startsWith('refresh_token='))!.split(';')[0]!
    })

    it('returns 409 Conflict when registering with duplicate email', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(409)

      const body = response.body as ErrorResponseBody
      expect(body.message).toContain('already registered')
    })
  })

  describe('POST /api/auth/login', () => {
    it('rejects invalid password', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401)
    })

    it('rejects nonexistent user email', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401)
    })

    it('successfully logs in with valid credentials', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)

      const body = response.body as AuthResponse
      expect(body.user.email).toBe(testEmail.toLowerCase())
      expect(body.accessToken).toBeDefined()

      const cookies = response.headers['set-cookie'] as unknown as string[]
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true)
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true)

      // Update tokens
      bearerToken = body.accessToken
      accessTokenCookie = cookies.find((c) => c.startsWith('access_token='))!.split(';')[0]!
      refreshTokenCookie = cookies.find((c) => c.startsWith('refresh_token='))!.split(';')[0]!
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns 401 when called without credentials', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .expect(401)
    })

    it('returns current user when called with access token cookie', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .set('Cookie', [accessTokenCookie])
        .expect(200)

      const body = response.body as UserWithProfile
      expect(body.email).toBe(testEmail.toLowerCase())
      expect(body.profile?.displayName).toBe(testDisplayName)
    })

    it('returns current user when called with Bearer Authorization header', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200)

      const body = response.body as UserWithProfile
      expect(body.email).toBe(testEmail.toLowerCase())
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('returns 401 when refresh token is missing', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .expect(401)
    })

    it('rotates tokens and sets new cookies when given valid refresh cookie', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(200)

      const body = response.body as AuthResponse
      expect(body.accessToken).toBeDefined()
      expect(body.user.email).toBe(testEmail.toLowerCase())

      const cookies = response.headers['set-cookie'] as unknown as string[]
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true)
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true)

      // The old refresh token should now be invalidated (rotation)
      await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(401)

      // Save the newly rotated tokens
      accessTokenCookie = cookies.find((c) => c.startsWith('access_token='))!.split(';')[0]!
      refreshTokenCookie = cookies.find((c) => c.startsWith('refresh_token='))!.split(';')[0]!
    })
  })

  describe('POST /api/auth/logout', () => {
    it('revokes session and clears auth cookies', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/logout')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie])
        .expect(200)

      const body = response.body as { success: boolean }
      expect(body.success).toBe(true)

      // Verify the revoked refresh token can no longer be used
      await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(401)
    })
  })
})
