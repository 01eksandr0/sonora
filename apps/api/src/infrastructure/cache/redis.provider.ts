import type { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import type { Env } from '../config/env.schema.js'
import { REDIS_CLIENT } from './redis.constants.js'

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) =>
    new Redis(config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    }),
}
