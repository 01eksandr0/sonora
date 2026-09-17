import { defineConfig } from 'vitest/config'

/** Requires running PostgreSQL + Redis (docker compose) and a valid .env. */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
