# Онбординг розробника

Цей документ пояснює, як влаштований проєкт, де що лежить і як тут прийнято писати код.
Прочитай його повністю перед першим PR. План розвитку продукту лежить у `ROADMAP.md`.

## 1. Що ми будуємо

Музичний веб-застосунок із власним backend. Deezer виступає лише зовнішнім каталогом:
пошук, артисти, альбоми, треки, обкладинки, 30-секундні preview. Усе інше (користувачі, auth,
onboarding, смаковий профіль, плейлисти, бібліотека, історія прослуховувань, рекомендації)
є нашою бізнес-логікою.

Головний принцип: **ми не Deezer-клієнт із проксі**. Frontend ніколи не ходить у Deezer напряму
і не знає його структур даних. Backend нормалізує каталог у власні доменні моделі.

```text
Vue SPA → api-client → NestJS API → Catalog → MusicProvider → DeezerProvider → Deezer API
                                        ↓
                             Redis (cache)  PostgreSQL (наші дані)
```

## 2. Стек і закріплені версії

| Шар      | Технології                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Frontend | Vue 3.5, Vite 8, TypeScript 6, Vue Router 5, Pinia 4, TanStack Query 5, PrimeVue 5, vee-validate + Zod 4 |
| Backend  | NestJS 12 (ESM), Prisma 7, PostgreSQL 17, Redis 7 (ioredis 6), Swagger, Zod для env                      |
| Тести    | Vitest (обидва застосунки), Supertest (API e2e), Playwright (web e2e)                                    |
| Тулінг   | pnpm 12 workspaces, ESLint 10, Prettier, GitHub Actions                                                  |

Версії зафіксовані точно (без `^`). Кілька пінів не випадкові, не оновлюй їх без перевірки:

- **TypeScript 6.0.x.** TypeScript 7 ще не підтримують typescript-eslint і частина екосистеми.
- **Prisma 7.10.** Тег `latest` у npm вказує на rc-версію 8.0.
- **NestJS 12 є ESM-only.** Тому `apps/api` зібраний як ES-модуль і тестується Vitest, а не Jest.
- **Zod 4 без `@vee-validate/zod`.** vee-validate 4.15 приймає Zod-схеми напряму через Standard Schema.

## 3. Структура монорепи

```text
music-app/
├── apps/
│   ├── web/                  Vue 3 SPA, Feature-Sliced Design
│   └── api/                  NestJS API
├── packages/
│   ├── shared-types/         типи, спільні для web і api (pagination, ImageSet, provider refs)
│   └── api-client/           типізований fetch-клієнт до нашого API
├── docker/                   допоміжні docker-файли
├── docker-compose.yml        локальні PostgreSQL + Redis
├── .github/workflows/ci.yml  lint → typecheck → build → test
├── tsconfig.base.json        спільні strict-опції TypeScript
├── pnpm-workspace.yaml       список workspace, дозволені postinstall-скрипти
└── ROADMAP.md, README.md, ONBOARDING.md
```

Пакети в `packages/` збираються через `tsc` у `dist/`; застосунки імпортують саме зібраний код.
Тому після зміни пакета запусти `pnpm --filter ./packages/* build` (кореневий `pnpm dev` робить це
сам). Нові пакети додаємо лише тоді, коли код реально потрібен обом застосункам.

## 4. Локальний запуск

```bash
corepack enable                         # або brew install pnpm
pnpm install
pnpm infra:up                           # Postgres :5432, Redis :6379 (потрібен Docker)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @music-app/api prisma:generate
pnpm dev                                # web :5173, api :3000
```

| Що       | Адреса                           |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| Health   | http://localhost:3000/api/health |
| Swagger  | http://localhost:3000/api/docs   |

Vite проксує `/api` на `http://localhost:3000`, тому в dev cookies і CORS не заважають.

Кореневі команди: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm format`.
Усі вони мають проходити перед PR, CI запускає ту саму послідовність.

## 5. Backend: `apps/api`

### 5.1 Розкладка

```text
src/
├── main.ts                     bootstrap: prefix /api, helmet, cookies, CORS, ValidationPipe, Swagger
├── app.module.ts               кореневий модуль, підключає infrastructure + domain modules
├── modules/                    доменні модулі
│   ├── health/                 приклад повного модуля: controller + service + spec
│   ├── auth/ users/ onboarding/ catalog/ playlists/ library/ history/ recommendations/
├── infrastructure/
│   ├── config/                 env.schema.ts (Zod), config.module.ts (@nestjs/config, global)
│   ├── database/               prisma.service.ts, database.module.ts (global)
│   ├── cache/                  cache.service.ts, redis.provider.ts, cache.module.ts (global)
│   └── providers/              зовнішні провайдери каталогу (Deezer), з'являться у Phase 3
├── common/                     filters, guards, interceptors, pipes, decorators, exceptions
└── generated/prisma/           згенерований Prisma Client, у git не потрапляє
prisma/schema.prisma            схема БД (моделі додаються у Phase 4)
prisma.config.ts                URL бази та шлях до міграцій (Prisma 7 читає його замість .env у схемі)
test/*.e2e-spec.ts              e2e через Supertest, потребують живих Postgres і Redis
```

### 5.2 Правила модулів

- **Один домен = один модуль** у `src/modules/<domain>/`. Усередині: `<domain>.module.ts`,
  `<domain>.controller.ts`, `<domain>.service.ts`, `dto/`, за потреби `entities/` або `mappers/`.
- **Залежності лише вниз по роадмапу.** `Recommendations` може залежати від `Users`, `Catalog`,
  `History`, `Library`, але не навпаки. Якщо потрібна зворотна залежність, це сигнал переглянути межі.
- **Infrastructure-модулі глобальні.** `PrismaService` і `CacheService` доступні для інжекції
  без імпорту модуля.
- **Конфіг тільки через `ConfigService<Env, true>`.** Усі змінні описані в `env.schema.ts`;
  застосунок не стартує з невалідним `.env`. Нова змінна: додай у схему і в `.env.example`.
- **ESM-нюанси.** Відносні імпорти закінчуються на `.js` навіть для `.ts`-файлів
  (`import { X } from './x.service.js'`). Alias `@/` в API не використовується, бо Node не вміє його
  резолвити в рантаймі. CommonJS-пакети імпортуємо іменованим експортом, де він є
  (`import { Redis } from 'ioredis'`).

### 5.3 Як написати endpoint

Схема на прикладі майбутнього `GET /api/catalog/search`:

1. **DTO запиту** у `dto/search-query.dto.ts` через `class-validator` + `class-transformer`.
   `ValidationPipe` глобальний, з `whitelist` і `forbidNonWhitelisted`: невідомі поля дають 400.

   ```ts
   export class SearchQueryDto {
     @IsString() @MinLength(1) q!: string
     @IsOptional() @IsInt() @Min(1) @Max(100) limit = 25
     @IsOptional() @IsInt() @Min(0) offset = 0
   }
   ```

2. **Сервіс** повертає доменні моделі, не Deezer DTO. Пагінація тільки в нашому контракті
   `Paginated<T>` з `@music-app/shared-types`: `{ items, pagination: { total, limit, offset, hasNext } }`.

3. **Контролер** тонкий: декоратори маршруту, Swagger-анотації, виклик сервісу.

   ```ts
   @ApiTags('catalog')
   @Controller('catalog')
   export class CatalogController {
     @Get('search')
     @ApiOkResponse({ description: 'Track summaries matching the query' })
     search(@Query() query: SearchQueryDto) {
       return this.catalog.search(query)
     }
   }
   ```

4. **Помилки** кидаємо стандартними `HttpException` з `@nestjs/common`. Глобальний
   `HttpExceptionFilter` приводить усе до єдиного тіла
   `{ statusCode, error, message, path, timestamp }` і логує 5xx.

5. **Тести.** Unit-тест сервісу поруч, `*.spec.ts`, залежності мокаються через
   `Test.createTestingModule` (див. `health.service.spec.ts`). Для API-контракту пишемо
   `test/<domain>.e2e-spec.ts` на Supertest.

6. **Swagger** генерується з декораторів і є source of truth для контракту. Frontend звіряється
   з `/api/docs`, а не з припущеннями.

### 5.4 Робота з кешем (Redis)

`CacheService` (`src/infrastructure/cache/cache.service.ts`) є єдиною точкою доступу до Redis.
Не інжектуй `REDIS_CLIENT` у доменні сервіси напряму.

```ts
const track = await this.cache.getOrSet(`catalog:track:${id}`, 60 * 60, () =>
  this.provider.getTrack(id),
)
```

Правила:

- **Ключі з неймспейсом** через двокрапку: `catalog:track:{id}`, `catalog:search:{hash}`,
  `session:{userId}:{tokenId}`, `reco:{userId}`. Константи ключів тримай у модулі, який ними володіє.
- **Завжди з TTL.** Кеш Deezer тимчасовий: preview URL не є постійним asset. Орієнтири:
  пошук 5 хв, деталі треку/альбому/артиста 1 год, рекомендації 15 хв.
- **Кешуємо доменні моделі**, а не сирі відповіді Deezer, щоб зміна маперу не вимагала flush.
- **Інвалідація** через `del(key)` у тій самій операції, що змінює дані.
- **Redis не є джерелом істини.** Все, що потрібно бізнес-логіці, живе в PostgreSQL.

### 5.5 Робота з базою (Prisma 7)

- Схема в `prisma/schema.prisma`, підключення в `prisma.config.ts`, клієнт генерується у
  `src/generated/prisma/` (gitignored, тому `prisma:generate` потрібен після клону та після кожної
  зміни схеми).
- Prisma 7 працює через driver adapter: `PrismaService` створює `PrismaPg` і передає його в клієнт.
- Цикл змін: правиш `schema.prisma` → `pnpm --filter @music-app/api prisma:migrate` (створює
  міграцію і перегенерує клієнт) → комітиш `prisma/migrations/**`.
- Primary key завжди наш UUID. Зовнішні ідентифікатори зберігаються як пара
  `(provider, providerId)` з unique constraint. Плейлисти, бібліотека, історія посилаються на наш `id`.
- Не зберігаємо весь каталог Deezer, вкладені об'єкти та аудіо. Список полів, які персистимо,
  визначається під час проєктування Catalog.
- Кросмодульні операції (наприклад, завершення onboarding) виконуються в `prisma.$transaction`.

### 5.6 Безпека

Уже увімкнено: helmet, cookie-parser, CORS з `credentials: true` для `CORS_ORIGIN`, глобальний
`ThrottlerGuard` (100 запитів/хв). Заплановано: JWT access + refresh у HttpOnly cookies з ротацією,
argon2 для паролів, CSRF-стратегія. Секрети лише через env; Deezer credentials ніколи не потрапляють
у frontend.

## 6. Frontend: `apps/web`

### 6.1 Feature-Sliced Design

```text
src/
├── app/        main.ts, App.vue, providers/ (Pinia, TanStack Query, PrimeVue), router/, layouts/, styles/
├── pages/      одна папка на маршрут, експортує компонент через index.ts
├── widgets/    складені блоки UI: app-header, app-sidebar, music-player, queue, track-list, album-grid
├── features/   сценарії користувача: auth, onboarding, player, playlists, library
├── entities/   бізнес-сутності та їх типи: user, track, artist, album, playlist
└── shared/     api/ (клієнт, QueryClient, ключі), ui/, lib/, config/, types/, constants/
```

Напрямок залежностей строго вгору: `shared ← entities ← features ← widgets ← pages ← app`.
Нижній шар не імпортує верхній. Один slice не імпортує іншого з того ж шару напряму (наприклад,
`features/player` не лізе у `features/playlists`); спільне піднімається в `entities` або `shared`.

Кожен slice має публічний `index.ts`. Імпортуємо лише через нього:
`import { useSessionStore } from '@/features/auth'`, а не з `.../model/session.store`.

Alias `@/` вказує на `src/`.

### 6.2 Стан: TanStack Query проти Pinia

> Server state → TanStack Query. Client state → Pinia.

- **TanStack Query** для всього, що приходить з API: current user, пошук, треки, альбоми,
  плейлисти, бібліотека, рекомендації. Не дублюй ці дані в Pinia.
- **Pinia** для стану, який живе лише в браузері: плеєр, черга, UI, чернетка onboarding, тема.
- Ключі запитів централізовано в `src/shared/api/query-keys.ts`. Новий домен додає свою гілку:
  `catalog: { search: (q) => ['catalog', 'search', q] as const }`.
- Дефолти `QueryClient` у `query-client.ts`: `staleTime` 60 с, один retry, без refetch на фокус.

Приклад composable у `entities/track/api/use-track.ts`:

```ts
export function useTrack(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.catalog.track(toValue(id))),
    queryFn: () => api.catalog.getTrack(toValue(id)),
  })
}
```

Мутації (`useMutation`) після успіху інвалідують потрібні ключі через `queryClient.invalidateQueries`.

### 6.3 Виклики API

Frontend ходить в API тільки через `api` з `src/shared/api/client.ts`, який створений на базі
`@music-app/api-client`. Клієнт надсилає cookies (`credentials: 'include'`) і кидає `ApiError`
зі статусом та тілом на не-2xx.

Новий backend-endpoint означає новий метод у `packages/api-client/src/client.ts` у відповідному
неймспейсі (`api.catalog.search`, `api.playlists.create`) із типами з `@music-app/shared-types`.
Так контракт типізований в одному місці для обох застосунків.

### 6.4 Роутинг

Маршрути в `src/app/router/routes.ts`, імена в `ROUTE_NAMES`, навігуємо за іменем, а не за рядком.
Публічні сторінки під `PublicLayout`, застосунок під `AppLayout` з `meta.requiresAuth`.
Guard у `guards.ts` реалізує ланцюжок `anonymous → login → onboarding → app`: неавторизованих веде
на `/login`, авторизованих без завершеного onboarding на `/app/onboarding`.

### 6.5 Форми та UI

- Форми: vee-validate + Zod-схема, передана напряму в `validationSchema`.
- UI: PrimeVue 5 з пресетом Aura (`app/providers/index.ts`), dark mode через клас `.app-dark`.
  Власні компоненти-обгортки кладемо в `shared/ui`.
- Стилі: scoped CSS у компонентах, глобальне лише в `app/styles/main.css`. Використовуй CSS-змінні
  теми PrimeVue (`--p-*`), а не хардкод кольорів.

## 7. Тестування

| Рівень         | Інструмент         | Де                                 | Команда                                 |
| -------------- | ------------------ | ---------------------------------- | --------------------------------------- |
| Unit API       | Vitest             | `apps/api/src/**/*.spec.ts`        | `pnpm --filter @music-app/api test`     |
| API e2e        | Vitest + Supertest | `apps/api/test/*.e2e-spec.ts`      | `pnpm --filter @music-app/api test:e2e` |
| Unit/component | Vitest + jsdom     | `apps/web/src/**/*.{test,spec}.ts` | `pnpm --filter @music-app/web test`     |
| Browser e2e    | Playwright         | `apps/web/e2e/*.spec.ts`           | `pnpm --filter @music-app/web test:e2e` |

Мінімум для PR: unit-тест на кожен новий сервіс або store і e2e на кожен новий публічний endpoint.
Для Playwright один раз виконай `pnpm --filter @music-app/web exec playwright install chromium`.

## 8. Конвенції коду

- Prettier без крапок з комою, одинарні лапки, ширина 100. `pnpm format` перед комітом.
- ESLint у режимі `--max-warnings 0`. В API увімкнено type-aware правила; `any` дозволений, але
  unsafe-виклики на ньому ловляться.
- Імпорти типів через `import type`.
- Provider-specific типи мають префікс провайдера: `DeezerTrack`, `DeezerAlbum`. Вони живуть в
  `infrastructure/providers/deezer/` і не виходять за межі маперів.
- Розділяємо `Summary` і `Details` моделі (`TrackSummary` для списків, `TrackDetails` для сторінки).
- Env-змінні: у API валідуються Zod-схемою, у web доступні лише з префіксом `VITE_` через
  `shared/config/env.ts`.

## 9. Git

Проєкт ведеться в локальному репозиторії. Не додавай remote і не пуш до сторонніх хостингів без
погодження з власником. Перед першим комітом перевір `git config user.email` у цій папці.

## 10. Документація та посилання

**Наші документи**

- `ROADMAP.md`: доменна модель, фази розробки, найближчі кроки.
- Swagger `/api/docs`: актуальний контракт REST API.
- `ARCHITECTURE.md` та `API.md` з'являться разом із Catalog.

**Backend**

- NestJS: https://docs.nestjs.com
- NestJS Config: https://docs.nestjs.com/techniques/configuration
- NestJS Swagger: https://docs.nestjs.com/openapi/introduction
- NestJS Throttler: https://github.com/nestjs/throttler
- NestJS Testing: https://docs.nestjs.com/fundamentals/testing
- Prisma ORM: https://www.prisma.io/docs/orm
- Prisma 7 config file: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- Prisma driver adapters (pg): https://www.prisma.io/docs/orm/overview/databases/postgresql
- Prisma migrations: https://www.prisma.io/docs/orm/prisma-migrate
- Redis commands: https://redis.io/docs/latest/commands/
- Redis caching patterns: https://redis.io/docs/latest/develop/use/patterns/
- ioredis: https://github.com/redis/ioredis
- class-validator: https://github.com/typestack/class-validator
- class-transformer: https://github.com/typestack/class-transformer
- Zod: https://zod.dev
- argon2 (Node): https://github.com/ranisalt/node-argon2
- Supertest: https://github.com/ladjs/supertest

**Frontend**

- Vue 3: https://vuejs.org/guide/introduction.html
- Vue Router: https://router.vuejs.org
- Pinia: https://pinia.vuejs.org
- TanStack Query (Vue): https://tanstack.com/query/latest/docs/framework/vue/overview
- TanStack Query: ключі та інвалідація: https://tanstack.com/query/latest/docs/framework/vue/guides/query-keys
- VueUse: https://vueuse.org
- PrimeVue: https://primevue.org
- PrimeVue theming (Aura, design tokens): https://primevue.org/theming/styled/
- PrimeIcons: https://primevue.org/icons/
- vee-validate: https://vee-validate.logaretm.com/v4/
- Vite: https://vite.dev/guide/
- Feature-Sliced Design: https://feature-sliced.design/docs

**Тести та тулінг**

- Vitest: https://vitest.dev/guide/
- Vue Test Utils: https://test-utils.vuejs.org
- Playwright: https://playwright.dev/docs/intro
- pnpm workspaces: https://pnpm.io/workspaces
- typescript-eslint: https://typescript-eslint.io
- eslint-plugin-vue: https://eslint.vuejs.org

**Зовнішній каталог**

- Deezer API: https://developers.deezer.com/api
- Deezer Search: https://developers.deezer.com/api/search
- Deezer Track / Album / Artist: https://developers.deezer.com/api/track,
  https://developers.deezer.com/api/album, https://developers.deezer.com/api/artist

**Інфраструктура**

- Docker Compose: https://docs.docker.com/compose/
- Railway: https://docs.railway.com
- Vercel (Vite SPA): https://vercel.com/docs/frameworks/vite
