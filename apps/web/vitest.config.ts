import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.ts'],
        exclude: ['e2e/**', 'node_modules/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html'],
          include: ['src/**/*.{ts,vue}'],
        },
      },
    }),
  ),
)
