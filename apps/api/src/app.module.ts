import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppConfigModule } from './infrastructure/config/config.module.js'
import { DatabaseModule } from './infrastructure/database/database.module.js'
import { CacheModule } from './infrastructure/cache/cache.module.js'
import { HealthModule } from './modules/health/health.module.js'

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    CacheModule,
    HealthModule,
    // Domain modules (added per roadmap phase):
    // AuthModule, UsersModule, OnboardingModule, CatalogModule,
    // PlaylistsModule, LibraryModule, HistoryModule, RecommendationsModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
