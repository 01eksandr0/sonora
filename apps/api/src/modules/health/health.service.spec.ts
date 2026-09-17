import { Test } from '@nestjs/testing'
import { CacheService } from '../../infrastructure/cache/cache.service.js'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { HealthService } from './health.service.js'

describe('HealthService', () => {
  async function build(db: boolean, redis: boolean) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: { isHealthy: vi.fn().mockResolvedValue(db) } },
        { provide: CacheService, useValue: { isHealthy: vi.fn().mockResolvedValue(redis) } },
      ],
    }).compile()
    return moduleRef.get(HealthService)
  }

  it('reports ok when all dependencies are up', async () => {
    const service = await build(true, true)
    const report = await service.check()
    expect(report.status).toBe('ok')
    expect(report.checks).toEqual({ database: 'up', redis: 'up' })
  })

  it('reports error when a dependency is down', async () => {
    const service = await build(true, false)
    const report = await service.check()
    expect(report.status).toBe('error')
    expect(report.checks.redis).toBe('down')
  })
})
