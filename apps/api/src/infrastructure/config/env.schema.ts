import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('api'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.string().default('30d'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  DEEZER_API_URL: z.url().default('https://api.deezer.com'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${issues}`)
  }
  return result.data
}
