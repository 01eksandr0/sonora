import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'
import type { Env } from '../config/env.schema.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(config: ConfigService<Env, true>) {
    const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) })
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Connected to PostgreSQL')
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
