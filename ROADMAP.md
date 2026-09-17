# Music App — Project Roadmap

## 1. Проект

Музыкальное веб-приложение с собственным backend и бизнес-логикой.

Основной внешний источник музыкального каталога — **Deezer API**.

Deezer используется для:

- поиска музыки;
- получения информации об артистах;
- получения информации об альбомах;
- получения треков;
- получения изображений;
- получения 30-секундных preview.

Собственный backend отвечает за:

- пользователей;
- authentication;
- onboarding;
- пользовательские предпочтения;
- playlists;
- library;
- listening history;
- рекомендации;
- бизнес-логику;
- нормализацию данных Deezer;
- кеширование внешнего каталога.

Полные аудиофайлы Deezer не хранятся и не раздаются нашим backend.

---

## 2. Основной стек

### Frontend

Vue 3, TypeScript, Vite, pnpm, Vue Router, Pinia, TanStack Query, VueUse, PrimeVue, PrimeIcons,
vee-validate, Zod, ESLint, Prettier, Vitest, Playwright.

Архитектура: **Feature-Sliced Design (FSD)**. SSR/SSG/Nuxt не используется.

### Backend

NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, REST API, JWT, HttpOnly Secure cookies,
Swagger / OpenAPI, Docker, Vitest, Supertest.

Backend архитектура — domain/module-oriented.

### Infrastructure

Production:

```text
Frontend  → Vercel
Backend   → Railway
Database  → Railway PostgreSQL
Redis     → Railway Redis
```

Local development:

```text
Vite      → :5173
NestJS    → :3000
Postgres  → :5432
Redis     → :6379
```

Docker Compose используется прежде всего для локальной инфраструктуры.

---

## 3. Monorepo

```text
music-app/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── api-client/
│   └── shared-types/
├── docker/
├── .github/workflows/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Не создавать большое количество packages заранее. Добавлять новые packages только когда появляется
реальная необходимость.

---

## 4. Frontend Architecture (FSD)

```text
apps/web/src/
├── app/        layouts, providers, router, styles, App.vue, main.ts
├── pages/      landing, login, register, forgot-password, app/{home,search,artist,album,playlist,library,onboarding,settings}
├── widgets/    app-header, app-sidebar, music-player, queue, track-list, album-grid
├── features/   auth, onboarding, player, playlists, library
├── entities/   user, track, artist, album, playlist
└── shared/     api, ui, lib, config, types, constants
```

Направление зависимостей: `shared ← entities ← features ← widgets ← pages ← app`.
Нижний слой не должен зависеть от верхнего.

---

## 5. Routing

Публичная часть: `/`, `/login`, `/register`, `/forgot-password`.

Приложение (требует авторизации): `/app`, `/app/onboarding`, `/app/search`, `/app/artist/:id`,
`/app/album/:id`, `/app/playlist/:id`, `/app/library`, `/app/settings`.

```text
anonymous → landing → login/register → authenticated → onboarding → application
```

Если onboarding не завершён: `/app → /app/onboarding`.

---

## 6. Frontend State Management

> Server state → TanStack Query
> Client state → Pinia

Pinia: player, queue, UI state, onboarding draft, theme, локальные preferences.
TanStack Query: current user, search, tracks, artists, albums, playlists, library, recommendations.

---

## 7. Backend Architecture

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── modules/         auth, users, onboarding, catalog, playlists, library, history, recommendations
├── infrastructure/  database, cache, providers, config
└── common/          decorators, guards, interceptors, filters, pipes, exceptions
```

---

## 8–9. Domains и зависимости

```text
Auth ──────────────► Users
Onboarding ────────► Users, Catalog
Playlists ─────────► Users, Catalog
Library ───────────► Users, Catalog
History ───────────► Users, Catalog
Recommendations ──► Users, Catalog, History, Library
```

Users / Catalog / History / Library → Recommendations, но не наоборот.

---

## 10. Authentication

```text
anonymous → register → registered → onboarding pending → onboarding complete → active
```

Auth: register, login, logout, refresh, password, session, JWT.
Users: identity, profile, preferences, account settings, onboarding status.

---

## 11. User

```ts
interface User {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
}

interface UserProfile {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}
```

Не помещать preferences напрямую в User.

---

## 12. Onboarding

```text
/register → account created → /app/onboarding → genres → artists → languages → moods
  → POST /api/onboarding → /app
```

Frontend хранит промежуточный state в Pinia. В конце отправляется один payload.
Backend выполняет операцию транзакционно.

---

## 13. Taste Profile

```text
Onboarding → TasteProfile → Recommendations
```

TasteProfile: genres, artists, languages, moods. Предпочтения имеют веса:

```ts
TasteGenre { genreId: string; weight: number; source: TasteSignalSource }
TasteArtist { artistId: string; weight: number; source: TasteSignalSource }
```

Источники: `ONBOARDING`, `LIKE`, `LISTEN`, `SKIP`, `MANUAL`.

---

## 14. Taste Signals

Сигналы: onboarding, like, unlike, play, skip, preview started, 10 sec listened, 25 sec listened,
completed, replay.

```text
ListeningHistory → raw behavioral data
TasteProfile     → derived user preferences
```

---

## 15. CATALOG — NEXT MAJOR STEP

```text
Application → Catalog → MusicProvider → DeezerProvider → Deezer API
```

Приложение не должно зависеть от структуры Deezer API напрямую.

## 16. MusicProvider

```ts
interface MusicProvider {
  search(query: string): Promise<SearchResult>
  getTrack(id: string): Promise<Track>
  getAlbum(id: string): Promise<Album>
  getArtist(id: string): Promise<Artist>
}
```

Реализации: `DeezerProvider` (сейчас), в будущем `TidalProvider`, `AppleMusicProvider`.

## 17. Deezer DTO Layer

```text
Deezer API → Deezer DTO → DeezerMapper → Domain Model
```

Provider-specific типы с префиксом: `DeezerTrack`, `DeezerArtist`, `DeezerAlbum`, `DeezerGenre`,
`DeezerSearchResult`.

## 18–20. Canonical models

```ts
interface Track {
  provider: 'deezer'
  providerId: string
  title: string
  titleVersion: string | null
  duration: number
  previewUrl: string | null
  explicit: boolean
  artist: ArtistReference
  album: AlbumReference
}

interface Artist {
  provider: 'deezer'
  providerId: string
  name: string
  images: ImageSet
  albumsCount: number | null
  fansCount: number | null
}

interface Album {
  provider: 'deezer'
  providerId: string
  title: string
  artist: ArtistReference
  cover: ImageSet
  releaseDate: string | null
  recordType: AlbumRecordType | null
  tracksCount: number | null
  duration: number | null
  explicit: boolean
  genres: GenreReference[]
  tracks?: Track[]
}
```

## 21. Images

```ts
interface ImageSet {
  small: string | null
  medium: string | null
  large: string | null
  xl: string | null
}
```

Deezer mapping: `cover_small → small`, `cover_medium → medium`, `cover_big → large`, `cover_xl → xl`.

## 22. Summary vs Details

`TrackSummary/TrackDetails`, `ArtistSummary/ArtistDetails`, `AlbumSummary/AlbumDetails`,
`PlaylistSummary/PlaylistDetails`. Search → Summary[], страница сущности → Details.

## 23. Provider IDs

В базе — собственные UUID как primary key, provider ID отдельно. Unique constraint
`(provider, providerId)`. Playlist/Library/History ссылаются на наш `Track.id`.

## 24. Catalog Storage Strategy

Не хранить весь каталог Deezer, огромные nested объекты, аудиофайлы; preview URL — не постоянный asset.

```text
Deezer → Catalog → Redis cache → PostgreSQL only for required normalized entities
```

## 25. Pagination

Наш canonical response (frontend не видит Deezer `next`):

```json
{
  "items": [],
  "pagination": { "total": 1234, "limit": 25, "offset": 0, "hasNext": true }
}
```

## 26. Catalog API

```http
GET /api/catalog/search?q=metal&limit=25&offset=0
GET /api/catalog/tracks/:id
GET /api/catalog/artists/:id
GET /api/catalog/albums/:id
GET /api/catalog/genres
```

Позже: `/artists/:id/albums`, `/albums/:id/tracks`, `/artists/:id/top-tracks`.

---

## 27. Playlists

Our Playlist ≠ Deezer Playlist. Create, rename, description, cover, delete, add/remove/reorder tracks,
public/private, ownership. `Playlist → PlaylistTrack → Track`.

## 28. Library

Liked tracks / albums / artists. `like`/`unlike` idempotent.

## 29. Listening History

```ts
ListeningHistory { userId; trackId; startedAt; listenedSeconds; completed }
```

Позже: skipped, source, queuePosition, sessionId.

## 30. Recommendation Engine

Первая версия — explainable weighted scoring (не ML):

```text
score = genre + artist + language + mood + listening history + liked tracks
```

Pipeline: Candidate generation → Scoring → Ranking → Recommendations.

## 31. Player

Состояние: currentTrack, queue, isPlaying, currentTime, duration, volume.
Функции: play, pause, next, previous, seek, volume, repeat, shuffle.
Lifecycle: play → preview started → 10 sec → 25 sec → completed → replay / skip → события в backend.

## 32–34. Pages, Widgets, API Client

Pages: Landing, Login, Register, Forgot Password, Home, Search, Artist, Album, Playlist, Library,
Settings, Onboarding.

Widgets: AppHeader, AppSidebar, MusicPlayer, Queue, TrackList, AlbumGrid, ArtistCard, AlbumCard,
PlaylistCard, SearchResults, RecommendationSection. UI — PrimeVue.

Frontend не обращается к Deezer напрямую:

```text
Vue → TanStack Query → api-client → NestJS API → Catalog → DeezerProvider → Deezer
```

## 35. Security

Password hashing, JWT access + refresh, HttpOnly/Secure cookies, refresh rotation, logout/revoke,
validation, rate limiting, CORS, CSRF strategy, secrets через env. Deezer credentials не во frontend.

## 36. Testing

Backend: unit (Auth/Onboarding/Catalog/Recommendation services), integration (Prisma, PostgreSQL,
Redis), API (Supertest). Frontend: Vitest, Playwright.

E2E сценарии: register, login, onboarding, search, open artist, open album, play preview, like track,
create playlist, add track to playlist.

## 37. Documentation

`README.md`, `ARCHITECTURE.md`, `API.md`, `ROADMAP.md`. Swagger/OpenAPI — source of truth для REST API.

---

## 38. Development Order

### Phase 1 — Project Foundation

- [x] Создать Git repository (локально)
- [x] Создать pnpm monorepo
- [x] Создать `apps/web`
- [x] Создать `apps/api`
- [x] Настроить TypeScript
- [x] Настроить ESLint
- [x] Настроить Prettier
- [x] Настроить Docker Compose
- [ ] Поднять PostgreSQL
- [ ] Поднять Redis

### Phase 2 — Backend Foundation

- [x] Создать NestJS application
- [x] Config module
- [x] Database module
- [x] Prisma
- [x] PrismaService
- [x] Redis module
- [x] Global validation
- [x] Global exception handling
- [x] Swagger
- [x] Health check

### Phase 3 — Catalog + Deezer (главный ближайший этап)

- [ ] Спроектировать Catalog module
- [ ] Создать Deezer DTO
- [ ] Создать MusicProvider interface
- [ ] Создать DeezerProvider
- [ ] Создать DeezerMapper
- [ ] Определить Track / Artist / Album / Genre
- [ ] Определить Summary/Details models
- [ ] Определить pagination
- [ ] Реализовать search, track/artist/album details
- [ ] Добавить Redis cache
- [ ] Определить PostgreSQL persistence strategy

### Phase 4 — Database

- [ ] Финализировать domain relationships
- [ ] Prisma schema: Users, Profiles, TasteProfile, Taste preferences, Track, Artist, Album, Genre,
      Playlist, PlaylistTrack, Library, ListeningHistory
- [ ] Indexes, unique constraints, migrations, seed

### Phase 5 — Auth + Users

- [ ] Register, Login, Logout, Refresh, Current user, Profile, Password handling, Session security

### Phase 6 — Onboarding

- [ ] Genre/Artist/Language/Mood selection, Pinia draft, validation, `POST /api/onboarding`,
      transaction, mark complete

### Phase 7 — Playlists

- [ ] CRUD, tracks, reorder, ownership, public/private, validation, API tests

### Phase 8 — Library

- [ ] Like/unlike track, album, artist; library queries

### Phase 9 — Listening History

- [ ] Play/skip events, duration, completion, replay, History API, taste signal processing

### Phase 10 — Recommendations

- [ ] Candidate generation, taste/history/library scoring, ranking, API, cache

### Phase 11 — Frontend

- [ ] App shell, sidebar, header, search, artist/album/playlist pages, library, home,
      recommendations, settings, onboarding

### Phase 12 — Player

- [ ] Audio engine, queue, play/pause, seek, volume, next/previous, shuffle, repeat,
      preview lifecycle, listening events

### Phase 13 — Quality

- [ ] Unit/integration/API/E2E tests, error/loading/empty states, accessibility, responsive,
      performance audit

### Phase 14 — Production

- [ ] Production Dockerfile, Railway API/PostgreSQL/Redis, Vercel frontend, env vars, migrations,
      CI/CD, health checks, logging, monitoring, domain, CORS

---

## 41. Immediate Next Steps

```text
1. Catalog domain
2. Deezer DTO
3. DeezerProvider
4. DeezerMapper
5. Track / Artist / Album / Genre
6. Catalog API
7. Redis cache
8. PostgreSQL persistence strategy
9. Prisma schema
10. Auth + Users
```

## 42. Главный архитектурный принцип

Наше приложение — **не Deezer client с backend-прокси**. Deezer предоставляет каталог,
**наш backend превращает этот каталог в продукт**: users → taste → playlists → library → history →
recommendations.
