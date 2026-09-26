import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppConfigModule } from './infrastructure/config/config.module.js'
import { DatabaseModule } from './infrastructure/database/database.module.js'
import { CacheModule } from './infrastructure/cache/cache.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { UsersModule } from './modules/users/users.module.js'
import { AuthModule } from './modules/auth/auth.module.js'

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    CacheModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
