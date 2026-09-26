import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Env } from '../../../infrastructure/config/env.schema.js'
import { UsersService } from '../../users/users.service.js'

export interface AccessTokenPayload {
  sub: string
  email: string
}

function cookieExtractor(req: Request): string | null {
  if (req && req.cookies && typeof req.cookies === 'object') {
    return (req.cookies as Record<string, string>)['access_token'] ?? null
  }
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<Env, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    })
  }

  async validate(payload: AccessTokenPayload) {
    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('User no longer exists')
    }
    return user
  }
}
