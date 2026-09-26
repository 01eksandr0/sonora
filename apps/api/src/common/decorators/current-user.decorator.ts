import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { UserWithProfileEntity } from '../../modules/users/users.service.js'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserWithProfileEntity | null => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: UserWithProfileEntity }>()
    return request.user ?? null
  },
)
