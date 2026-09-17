import { Injectable } from '@nestjs/common'
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'

export interface HealthReport {
  status: 'ok' | 'error'
  checks: Record<'database' | 'redis', 'up' | 'down'>
  timestamp: string
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([this.prisma.isHealthy(), this.cache.isHealthy()])

    const checks = {
      database: database ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
    } as const

    return {
      status: database && redis ? 'ok' : 'error',
      checks,
      timestamp: new Date().toISOString(),
    }
  }
}
