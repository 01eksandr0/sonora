import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { Server } from 'node:http'
import request from 'supertest'
import { AppModule } from '../src/app.module.js'

/**
 * Requires running PostgreSQL + Redis (see docker-compose.yml) and a valid .env.
 */
describe('GET /api/health (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns ok when dependencies are reachable', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/health')
      .expect(200)
    expect((response.body as { status: string }).status).toBe('ok')
  })
})
