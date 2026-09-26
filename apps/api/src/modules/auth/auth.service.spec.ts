import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'
import type { Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import { UsersService, type UserWithProfileEntity } from '../users/users.service.js'
import { AuthService } from './auth.service.js'

describe('AuthService', () => {
  let service: AuthService
  let usersServiceMock: {
    findByEmail: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    toResponseDto: ReturnType<typeof vi.fn>
  }
  let jwtServiceMock: {
    signAsync: ReturnType<typeof vi.fn>
    verifyAsync: ReturnType<typeof vi.fn>
  }
  let cacheServiceMock: {
    get: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    del: ReturnType<typeof vi.fn>
  }
  let configServiceMock: {
    get: ReturnType<typeof vi.fn>
  }
  let resMock: {
    cookie: ReturnType<typeof vi.fn>
    clearCookie: ReturnType<typeof vi.fn>
  }

  const mockUser: UserWithProfileEntity = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-uuid-1',
      userId: 'user-uuid-1',
      displayName: 'Alex',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      toResponseDto: vi.fn((u: UserWithProfileEntity) => ({
        id: u.id,
        email: u.email,
        onboardingCompleted: u.onboardingCompleted,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        profile: u.profile,
      })),
    }

    jwtServiceMock = {
      signAsync: vi.fn((payload: { sub: string }) => Promise.resolve(`signed-${payload.sub}`)),
      verifyAsync: vi.fn(),
    }

    cacheServiceMock = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    }

    configServiceMock = {
      get: vi.fn((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'access-secret-at-least-32-chars-long'
          case 'JWT_ACCESS_TTL':
            return '15m'
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret-at-least-32-chars-long'
          case 'JWT_REFRESH_TTL':
            return '30d'
          case 'COOKIE_SECURE':
            return false
          default:
            return undefined
        }
      }),
    }

    resMock = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('register', () => {
    it('throws ConflictException if email already registered', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)

      await expect(
        service.register(
          { email: 'user@example.com', password: 'password123' },
          resMock as unknown as Response,
        ),
      ).rejects.toThrow(ConflictException)
    })

    it('creates user, sets session and cookies on success', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null)
      usersServiceMock.create.mockResolvedValue(mockUser)

      const result = await service.register(
        { email: 'new@example.com', password: 'password123', displayName: 'Alex' },
        resMock as unknown as Response,
      )

      expect(usersServiceMock.create).toHaveBeenCalled()
      expect(cacheServiceMock.set).toHaveBeenCalled()
      expect(resMock.cookie).toHaveBeenCalledTimes(2)
      expect(result.user.email).toBe(mockUser.email)
      expect(result.accessToken).toBe(`signed-${mockUser.id}`)
    })
  })

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null)

      await expect(
        service.login(
          { email: 'notfound@example.com', password: 'password123' },
          resMock as unknown as Response,
        ),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException if password does not match', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)
      vi.spyOn(service, 'verifyPassword').mockResolvedValue(false)

      await expect(
        service.login(
          { email: 'user@example.com', password: 'wrongpassword' },
          resMock as unknown as Response,
        ),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('authenticates user and sets session on success', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)
      vi.spyOn(service, 'verifyPassword').mockResolvedValue(true)

      const result = await service.login(
        { email: 'user@example.com', password: 'correctpassword' },
        resMock as unknown as Response,
      )

      expect(cacheServiceMock.set).toHaveBeenCalled()
      expect(resMock.cookie).toHaveBeenCalledTimes(2)
      expect(result.user.id).toBe(mockUser.id)
    })
  })

  describe('refresh', () => {
    it('throws UnauthorizedException when no token provided', async () => {
      await expect(service.refresh(undefined, resMock as unknown as Response)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when token verification fails', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('Invalid token'))

      await expect(
        service.refresh('invalid-token', resMock as unknown as Response),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when session not found in Redis', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'user@example.com',
        tokenId: 'token-uuid-1',
      })
      cacheServiceMock.get.mockResolvedValue(null)

      await expect(service.refresh('valid-token', resMock as unknown as Response)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rotates refresh token and sets new cookies', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'user@example.com',
        tokenId: 'token-uuid-1',
      })
      cacheServiceMock.get.mockResolvedValue({ userId: 'user-uuid-1', tokenId: 'token-uuid-1' })
      usersServiceMock.findById.mockResolvedValue(mockUser)

      const result = await service.refresh('valid-token', resMock as unknown as Response)

      expect(cacheServiceMock.del).toHaveBeenCalledWith('session:user-uuid-1:token-uuid-1')
      expect(cacheServiceMock.set).toHaveBeenCalled()
      expect(resMock.cookie).toHaveBeenCalledTimes(2)
      expect(result.user.id).toBe(mockUser.id)
    })
  })

  describe('logout', () => {
    it('deletes session from Redis and clears cookies', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'user@example.com',
        tokenId: 'token-uuid-1',
      })

      const result = await service.logout(
        'user-uuid-1',
        'valid-refresh-token',
        resMock as unknown as Response,
      )

      expect(cacheServiceMock.del).toHaveBeenCalledWith('session:user-uuid-1:token-uuid-1')
      expect(resMock.clearCookie).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })
  })
})
