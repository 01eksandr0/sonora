import { Global, Module } from '@nestjs/common'
import { CacheService } from './cache.service.js'
import { redisProvider } from './redis.provider.js'

@Global()
@Module({
  providers: [redisProvider, CacheService],
  exports: [CacheService],
})
export class CacheModule {}
