import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { REDIS_CLIENT } from './redis.constants.js'

/**
 * Thin typed wrapper over ioredis for JSON caching (Deezer responses, sessions,
 * recommendations). Keys should be namespaced: `catalog:track:{id}` etc.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit() {
    await this.redis.connect()
    this.logger.log('Connected to Redis')
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value)
    if (ttlSeconds) {
      await this.redis.set(key, raw, 'EX', ttlSeconds)
    } else {
      await this.redis.set(key, raw)
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached
    const value = await factory()
    await this.set(key, value, ttlSeconds)
    return value
  }

  async isHealthy(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG'
    } catch {
      return false
    }
  }
}
