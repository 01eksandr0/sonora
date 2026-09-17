# Music App

Музичний веб-застосунок із власним backend та бізнес-логікою. Зовнішнє джерело каталогу — Deezer API.

## Стек

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router, Pinia, TanStack Query, PrimeVue, vee-validate + Zod, Vitest, Playwright. Архітектура — Feature-Sliced Design.
- **Backend:** NestJS, Prisma, PostgreSQL, Redis, JWT + HttpOnly cookies, Swagger, Jest + Supertest.
- **Monorepo:** pnpm workspaces.

## Структура

```text
apps/
  web/            Vue 3 SPA (FSD)
  api/            NestJS API
packages/
  shared-types/   спільні типи (pagination, provider refs, images)
  api-client/     типізований HTTP-клієнт для API
docker/           допоміжні docker-файли
docker-compose.yml  локальні PostgreSQL + Redis
```

## Швидкий старт

```bash
corepack enable            # або: npm i -g pnpm
pnpm install
pnpm infra:up              # PostgreSQL :5432, Redis :6379
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @music-app/api prisma:generate
pnpm dev                   # web :5173, api :3000
```

- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Скрипти

| Команда          | Опис                              |
| ---------------- | --------------------------------- |
| `pnpm dev`       | web + api у watch-режимі          |
| `pnpm build`     | збірка всіх пакетів і застосунків |
| `pnpm lint`      | ESLint по всіх workspace          |
| `pnpm typecheck` | перевірка типів                   |
| `pnpm test`      | unit-тести (Vitest / Jest)        |
| `pnpm test:e2e`  | e2e (Playwright / Supertest)      |
| `pnpm format`    | Prettier                          |
| `pnpm infra:up`  | підняти Postgres + Redis          |

## Документація

- `ONBOARDING.md` — онбординг розробника: архітектура, конвенції, як писати API, кеш, посилання
- `ROADMAP.md` — план розробки
- `ARCHITECTURE.md`, `API.md` — заповнюються в міру розвитку
