import { randomUUID } from 'node:crypto'
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { AuthResponse } from '@music-app/shared-types'
import argon2 from 'argon2'
import type { Response } from 'express'
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import type { Env } from '../../infrastructure/config/env.schema.js'
import { UsersService, type UserWithProfileEntity } from '../users/users.service.js'
import type { LoginDto } from './dto/login.dto.js'
import type { RegisterDto } from './dto/register.dto.js'

export interface RefreshTokenPayload {
  sub: string
  email: string
  tokenId: string
}

function parseTtlToSeconds(ttl: string, defaultSeconds: number): number {
  const match = ttl.match(/^(\d+)([smhd])$/)
  if (!match) return defaultSeconds
  const value = parseInt(match[1]!, 10)
  const unit = match[2]
  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 3600
    case 'd':
      return value * 86400
    default:
      return defaultSeconds
  }
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string
  private readonly accessTtl: string
  private readonly refreshSecret: string
  private readonly refreshTtl: string
  private readonly accessTtlSeconds: number
  private readonly refreshTtlSeconds: number
  private readonly cookieSecure: boolean

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly cache: CacheService,
  ) {
    this.accessSecret = this.config.get('JWT_ACCESS_SECRET', { infer: true })
    this.accessTtl = this.config.get('JWT_ACCESS_TTL', { infer: true })
    this.refreshSecret = this.config.get('JWT_REFRESH_SECRET', { infer: true })
    this.refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true })
    this.cookieSecure = this.config.get('COOKIE_SECURE', { infer: true })

    this.accessTtlSeconds = parseTtlToSeconds(this.accessTtl, 15 * 60)
    this.refreshTtlSeconds = parseTtlToSeconds(this.refreshTtl, 30 * 24 * 3600)
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password)
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  }

  private sessionKey(userId: string, tokenId: string): string {
    return `session:${userId}:${tokenId}`
  }

  private async generateTokens(
    user: UserWithProfileEntity,
  ): Promise<{ accessToken: string; refreshToken: string; tokenId: string }> {
    const tokenId = randomUUID()

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.accessSecret,
        expiresIn: this.accessTtlSeconds,
      },
    )

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, tokenId },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtlSeconds,
      },
    )

    await this.cache.set(
      this.sessionKey(user.id, tokenId),
      { userId: user.id, tokenId, createdAt: new Date().toISOString() },
      this.refreshTtlSeconds,
    )

    return { accessToken, refreshToken, tokenId }
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      maxAge: this.accessTtlSeconds * 1000,
      path: '/',
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      maxAge: this.refreshTtlSeconds * 1000,
      path: '/api/auth',
    })
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
    })

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/api/auth',
    })
  }

  async register(dto: RegisterDto, res: Response): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) {
      throw new ConflictException('Email is already registered')
    }

    const passwordHash = await this.hashPassword(dto.password)
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    })

    const { accessToken, refreshToken } = await this.generateTokens(user)
    this.setAuthCookies(res, accessToken, refreshToken)

    return {
      user: this.usersService.toResponseDto(user),
      accessToken,
    }
  }

  async login(dto: LoginDto, res: Response): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const isMatch = await this.verifyPassword(user.passwordHash, dto.password)
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const { accessToken, refreshToken } = await this.generateTokens(user)
    this.setAuthCookies(res, accessToken, refreshToken)

    return {
      user: this.usersService.toResponseDto(user),
      accessToken,
    }
  }

  async refresh(refreshToken: string | undefined, res: Response): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required')
    }

    let payload: RefreshTokenPayload
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const session = await this.cache.get(this.sessionKey(payload.sub, payload.tokenId))
    if (!session) {
      throw new UnauthorizedException('Session expired or revoked')
    }

    // Revoke old session (refresh token rotation)
    await this.cache.del(this.sessionKey(payload.sub, payload.tokenId))

    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('User no longer exists')
    }

    const { accessToken, refreshToken: nextRefreshToken } = await this.generateTokens(user)
    this.setAuthCookies(res, accessToken, nextRefreshToken)

    return {
      user: this.usersService.toResponseDto(user),
      accessToken,
    }
  }

  async logout(
    userId: string | undefined,
    refreshToken: string | undefined,
    res: Response,
  ): Promise<{ success: boolean }> {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
          secret: this.refreshSecret,
          ignoreExpiration: true,
        })
        if (payload?.sub && payload?.tokenId) {
          await this.cache.del(this.sessionKey(payload.sub, payload.tokenId))
        }
      } catch {
        // Even if token verification fails, we still clear cookies
      }
    }

    this.clearAuthCookies(res)
    return { success: true }
  }
}
