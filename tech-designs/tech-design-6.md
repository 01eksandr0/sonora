# Технічний дизайн: Задача 6 — Обране, плейлисти, меню треку та розгорнутий плеєр

**Гілка:** `tech-design-6`  
**Статус:** Чернетка для реалізації  
**Автор:** Sonora Engineering Team  
**Дата:** 2026-11-27  
**Пов’язані розділи ROADMAP.md:** 4, 5, 8–9, 23, 27, 28, 31, 32–34, 38 (Phase 7, Phase 8, Phase 11, Phase 12)

---

## 1. Мета та контекст (Overview & Context)

### 1.1. Номер задачі та назва

- **Задача 6:** Обране, плейлисти, меню треку та розгорнутий плеєр (Favorites Page, Playlists, Track Context Menu, Expanded Player).

### 1.2. Посилання на ROADMAP.md

- [ROADMAP.md](../ROADMAP.md):
  - **Розділ 4 (Frontend Architecture):** FSD шари (`shared ← entities ← features ← widgets ← pages ← app`).
  - **Розділ 5 (Routing):** маршрути `/app/library`, `/app/library/playlists`, `/app/playlist/:id`, `/app/artist/:id`, `/app/album/:id`.
  - **Розділ 23 (Provider IDs):** UUID primary keys у PostgreSQL + пара `(provider, providerId)` для каталогу.
  - **Розділ 27 (Playlists):** власні плейлисти Sonora (`Playlist → PlaylistTrack → Track`), створення, редагування, видалення, додавання/видалення/впорядкування треків, контроль власника.
  - **Розділ 28 (Library):** улюблені треки (`FavoriteTrack`), ідемпотентні `like`/`unlike` та список обраного.
  - **Розділ 31 (Player):** глобальний стан відтворення, контекстна черга, неперервне відтворення.
  - **Розділи 38 (Фази розробки):** `Phase 7 — Playlists`, `Phase 8 — Library`, `Phase 11 — Frontend`, `Phase 12 — Player`.

### 1.3. Поточний стан кодової бази

На момент створення цього техдизайну:

1. **У гілці `main` (після Задачі 9):**
   - Реалізований `LibraryModule` (`apps/api/src/modules/library/`) з таблицею `FavoriteTrack` у PostgreSQL і ендпоінтами `POST/DELETE /api/library/favorites/tracks/:id`, `GET /api/library/favorites/tracks/status`, `GET /api/library/favorites/tracks`.
   - **Прогалина в `FavoriteTrack`:** модель зберігає лише `title`, `artistName`, `albumTitle`, `coverUrl` (small) і `duration`, але **не зберігає** `artistProviderId`, `albumProviderId`, `explicit`, `titleVersion` та повний `ImageSet`. Через це з переліку обраного неможливо перейти на сторінку автора/альбому або показати велике фото у розгорнутому плеєрі.
   - Реалізований `PlayerModule` (`apps/api/src/modules/player/`) з `PlayerQueueService` та `usePlayerStore` (`apps/web/src/features/player/model/player.store.ts`), де HTML5 `new Audio()` живе у Pinia-сторі. У `PlayerService` вже передбачений `ORDERED_CONTEXTS` для `'playlist'`, але логіки вибірки треків плейлиста та обраного в `PlayerQueueService` ще немає.
   - Модуль `PlaylistsModule` (`apps/api/src/modules/playlists/`) та фіча `features/playlists` містять лише `.gitkeep`. Моделі `Playlist` і `PlaylistTrack` у `prisma/schema.prisma` відсутні, хоча базові довідкові моделі `Artist`, `Album` і `Track` уже визначені в `schema.prisma`.
   - `MusicPlayer.vue` (`apps/web/src/widgets/music-player/ui/MusicPlayer.vue`) показує лише нижню компактну панель без розгорнутого режиму.
   - `TrackRow.vue` (`apps/web/src/entities/track/ui/TrackRow.vue`) та `RecommendationSection.vue` (`apps/web/src/widgets/recommendation-section/ui/RecommendationSection.vue`) не мають кнопки меню треку (трьох вертикальних крапок).
2. **У гілці `task-5` (очікує злиття в `main`):**
   - Додані сторінки `ArtistPage.vue` (`/app/artist/:id`) і `AlbumPage.vue` (`/app/album/:id`), а також секційні маршрути `ROUTE_NAMES.playlists` (`/app/library/playlists`), `ROUTE_NAMES.albums`, `ROUTE_NAMES.artists` в `apps/web/src/app/router/routes.ts` та навігація в `AppSidebar.vue`.
   - `LibraryPage.vue` та `PlaylistPage.vue` наразі є статичними заглушками.

> [!NOTE]
> Реалізація Задачі 6 спирається на маршрути та сторінки, додані в `task-5` (`/app/artist/:id`, `/app/album/:id`, `/app/library/playlists`). Перед стартом імплементації Задачі 6 гілку реалізації слід створювати після злиття `task-5` у `main` (або підтягнути зміни `task-5`).

### 1.4. Бізнес-вимоги та користувацькі сценарії

1. **Обране (Favorites):**
   - Трек можна додати в обране та прибрати з обраного (ідемпотентно) з будь-якого списку через меню треку, з міні-плеєра або з розгорнутого плеєра.
   - Стан лайку синхронізується між міні-плеєром, розгорнутим плеєром, меню треку та сторінкою «Обране».
   - На сторінці «Обране» (`/app/library`) показується реальний список лайкнутих треків користувача; треки можна відтворювати (по черзі в контексті `favorites`) і керувати ними через меню треку.
2. **Плейлисти (Playlists):**
   - Користувач може створювати власні плейлисти (назва, опціональний опис, приватність), редагувати їх і видаляти.
   - На сторінці списку плейлистов (`/app/library/playlists`) показуються плейлисти користувача та кнопка створення нового плейлиста.
   - На сторінці плейлиста (`/app/playlist/:id`) показуються обкладинка, назва, опис, кількість треків, кнопка Play і список треків у заданому порядку (`position`).
   - При запуску будь-якого треку в плейлисті наступні треки грають **суворо по порядку** плейлиста, а кнопка «Назад» повертає до попередніх треків плейлиста.
3. **Меню треку (Track Menu):**
   - У кожної пісні в усіх списках (`SearchResults`, `RecommendationSection` на Home, `ArtistPage`, `AlbumPage`, `LibraryPage`, `PlaylistPage`) праворуч з'являється кнопка з іконкою трьох вертикальних крапок (`⋮`).
   - Пункти меню:
     - «Додати до обраного» / «Видалити з обраного» (динамічно залежно від поточного стану).
     - «Додати до плейлиста».
     - «Видалити з плейлиста» (лише на сторінці власного плейлиста).
     - «Перейти до автора» (`/app/artist/:id`).
     - «Перейти до альбому» (`/app/album/:id`).
   - При виборі «Додати до плейлиста» відкривається діалог зі списком плейлистів користувача (з індикатором, у яких плейлистах трек уже є) та кнопкою **«Створити новий плейлист»**, що дозволяє одразу створити плейлист і додати до нього обраний трек.
4. **Розгорнутий плеєр (Expanded Player):**
   - По кліку на область треку або кнопку розгортання на панелі плеєра (`MusicPlayer.vue`) плеєр плавно розкривається у повноекранний інтерфейс (`ExpandedPlayer.vue`).
   - Показує велике фото обкладинки (`xl` / `large`), назву, автора, альбом, повний набір елементів керування відтворенням (seekbar з часом, Play/Pause, Next/Previous, гучність/Mute) та панель дій:
     - Перейти до автора;
     - Перейти до альбому;
     - Додати до обраного / видалити з обраного;
     - Додати до плейлиста;
     - Поділитися (Web Share API або копіювання посилання в буфер обміну з фідбеком).
   - **Музика при відкритті/закритті розгорнутого плеєра та при переходах на автора/альбом не переривається**, оскільки `HTMLAudioElement` залишається в Pinia-сторі `usePlayerStore`, а `MusicPlayer.vue` не розмонтовується.

### 1.5. Scope та Non-Goals

#### Входить у Scope:

- Розширення моделі `FavoriteTrack` у Prisma + додавання моделей `Playlist` і `PlaylistTrack`.
- Новий модуль `PlaylistsModule` у `apps/api` (CRUD плейлистів, додавання/видалення/зміна порядку треків).
- Оновлення `LibraryModule` (повні метадані треку для переходів на автора/альбом та великої обкладинки).
- Оновлення `PlayerModule` (`PlayerQueueService` і `PlayerService` для впорядкованого програвання контекстів `'playlist'` та `'favorites'`).
- Нові та оновлені контракти в `packages/shared-types` і `packages/api-client`.
- Оновлення UI-компонентів і сторінок в `apps/web`: `TrackRow`, `TrackMenu`, `PlaylistCard`, `AddToPlaylistDialog`, `CreatePlaylistDialog`, `ExpandedPlayer`, `MusicPlayer`, `LibraryPage`, `PlaylistPage`, інтеграція меню треку в усі списки.

#### Non-Goals (відкладається на наступні фази):

- Завантаження кастомних файлів обкладинок плейлиста на S3/CDN (поки використовується обкладинка першого треку або стильний плейсхолдер).
- Спільне редагування плейлистів кількома користувачами (collaborative playlists).
- Пошук по користувацьких плейлистах у загальному пошуку `/app/search` (таб `playlists` у пошуку поки показує порожній стан).
- Drag-and-drop сортування треків мишкою на фронтенді (бекенд-ендпоінт reorder передбачаємо, але у UI достатньо відображення та відтворення у порядку додавання).
- Лайк/збереження цілих альбомів та артистів (секції `Albums` і `Artists` у Library залишаються для наступної задачі).

---

## 2. Зміни в базі даних (Database / Prisma / PostgreSQL)

### 2.1. Аналіз та оновлення схеми

У `apps/api/prisma/schema.prisma` вже визначені моделі `Artist`, `Album`, `Track` (з унікальним ключем `(provider, providerId)`), але вони ще не використовуються жодним модулем. Для плейлистів ми задіємо саме цю нормалізовану структуру відповідно до `ROADMAP.md` (розділи 23, 27) та `ONBOARDING.md` (розділ 5.5): `Playlist → PlaylistTrack → Track → Artist / Album`.

Для `FavoriteTrack` (яка вже містить дані у БД) ми додаємо nullable/default колонки `artistProviderId`, `albumProviderId`, `titleVersion`, `explicit`, `cover` для зворотної сумісності без втрати існуючих записів.

### 2.2. Точні зміни для `apps/api/prisma/schema.prisma`

```prisma
model User {
  id                  String   @id @default(uuid())
  email               String   @unique
  passwordHash        String   @map("password_hash")
  onboardingCompleted Boolean  @default(false) @map("onboarding_completed")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  profile                  UserProfile?
  tasteProfile             TasteProfile?
  recommendationCollection RecommendationCollection?
  favoriteTracks           FavoriteTrack[]
  listeningHistory         ListeningHistory[]
  playlists                Playlist[]

  @@map("users")
}
```

```prisma
model Track {
  id           String        @id @default(uuid())
  provider     MusicProvider @default(DEEZER)
  providerId   String        @map("provider_id")
  title        String
  titleVersion String?       @map("title_version")
  duration     Int
  previewUrl   String?       @map("preview_url")
  explicit     Boolean       @default(false)
  artistId     String        @map("artist_id")
  albumId      String        @map("album_id")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  artist         Artist          @relation(fields: [artistId], references: [id], onDelete: Cascade)
  album          Album           @relation(fields: [albumId], references: [id], onDelete: Cascade)
  playlistTracks PlaylistTrack[]

  @@unique([provider, providerId])
  @@map("tracks")
}
```

```prisma
model FavoriteTrack {
  id               String        @id @default(uuid())
  userId           String        @map("user_id")
  provider         MusicProvider @default(DEEZER)
  providerId       String        @map("provider_id")
  title            String
  titleVersion     String?       @map("title_version")
  explicit         Boolean       @default(false)
  artistName       String        @map("artist_name")
  artistProviderId String?       @map("artist_provider_id")
  albumTitle       String?       @map("album_title")
  albumProviderId  String?       @map("album_provider_id")
  coverUrl         String?       @map("cover_url")
  cover            Json?         @default("{}")
  duration         Int
  previewUrl       String?       @map("preview_url")
  createdAt        DateTime      @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider, providerId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("favorite_tracks")
}

model Playlist {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String
  description String?
  coverUrl    String?  @map("cover_url")
  isPublic    Boolean  @default(false) @map("is_public")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks PlaylistTrack[]

  @@index([userId, updatedAt(sort: Desc)])
  @@map("playlists")
}

model PlaylistTrack {
  id         String   @id @default(uuid())
  playlistId String   @map("playlist_id")
  trackId    String   @map("track_id")
  position   Int
  addedAt    DateTime @default(now()) @map("added_at")

  playlist Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track    Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@unique([playlistId, trackId])
  @@index([playlistId, position])
  @@map("playlist_tracks")
}
```

### 2.3. Міграція та сідінг

- **Команда міграції:**
  ```bash
  pnpm --filter @music-app/api prisma:migrate -- --name add_playlists_and_favorite_metadata
  ```
- Повторна генерація Prisma Client (автоматична при `prisma:migrate`, або вручну):
  ```bash
  pnpm --filter @music-app/api prisma:generate
  ```
- Початкові дані у `seed.ts` не потрібні: плейлисти та обране є суто користувацькими даними.

---

## 3. Спільні контракти (`packages/*`)

### 3.1. `packages/shared-types`

#### 1) Оновлення `packages/shared-types/src/library.ts`

Додаємо канонічні поля `artist`, `album`, `explicit`, `titleVersion` до `FavoriteTrackSummary`, щоб фронтенд міг напряму передавати елементи обраного у `TrackRow`, `TrackMenu`, `ExpandedPlayer` та `usePlayerStore` без втрати ID автора/альбому чи обкладинки високої роздільності:

```ts
import type { ImageSet } from './image.js'
import type { TrackSummary } from './catalog.js'
import type { MusicProviderName } from './provider.js'

export interface FavoriteTrackSummary extends TrackSummary {
  id: string
  provider: MusicProviderName
  createdAt: string
  // Поля нижче зберігаємо для зворотної сумісності або уніфікуємо через TrackSummary:
  artistName: string
  albumTitle: string | null
  coverUrl: string | null
}

export interface FavoriteStatusResponse {
  [trackProviderId: string]: boolean
}
```

> [!TIP]
> Оскільки `TrackSummary` містить `provider`, `providerId`, `title`, `titleVersion`, `duration`, `previewUrl`, `explicit`, `artist: { provider, providerId, name }` та `album: { provider, providerId, title, cover: ImageSet }`, успадкування `FavoriteTrackSummary extends TrackSummary` робить кожен лайкнутий трек повністю сумісним із `TrackRow.vue`, `TrackMenu.vue` та `playerStore.playTrack()`.

#### 2) Новий файл `packages/shared-types/src/playlists.ts`

```ts
import type { ImageSet } from './image.js'
import type { TrackSummary } from './catalog.js'

export interface PlaylistSummary {
  id: string
  title: string
  description: string | null
  cover: ImageSet | null
  isPublic: boolean
  tracksCount: number
  isOwner: boolean
  containsTrack?: boolean
  createdAt: string
  updatedAt: string
}

export interface PlaylistTrackItem {
  id: string
  position: number
  addedAt: string
  track: TrackSummary
}

export interface PlaylistDetails extends PlaylistSummary {
  tracks: PlaylistTrackItem[]
}

export interface CreatePlaylistRequest {
  title: string
  description?: string | null
  isPublic?: boolean
  trackId?: string
}

export interface UpdatePlaylistRequest {
  title?: string
  description?: string | null
  isPublic?: boolean
}

export interface AddPlaylistTrackRequest {
  trackId: string
}

export interface ReorderPlaylistTracksRequest {
  trackIds: string[]
}
```

Експортувати `./playlists.js` у `packages/shared-types/src/index.ts`.

#### 3) Оновлення `packages/shared-types/src/player.ts`

Додати `'favorites'` до `PlayerContext['type']`:

```ts
export interface PlayerContext {
  type: 'search' | 'artist' | 'album' | 'playlist' | 'collection' | 'favorites'
  id?: string
  query?: string
}
```

### 3.2. `packages/api-client`

У `packages/api-client/src/client.ts` додати простір імен `playlists`:

```ts
playlists: {
  list: (params?: { limit?: number; offset?: number; trackId?: string }) =>
    http.get<Paginated<PlaylistSummary>>('/playlists', { query: params }),
  getById: (id: string) => http.get<PlaylistDetails>(`/playlists/${encodeURIComponent(id)}`),
  create: (body: CreatePlaylistRequest) => http.post<PlaylistDetails>('/playlists', { body }),
  update: (id: string, body: UpdatePlaylistRequest) =>
    http.patch<PlaylistDetails>(`/playlists/${encodeURIComponent(id)}`, { body }),
  remove: (id: string) =>
    http.delete<{ success: boolean }>(`/playlists/${encodeURIComponent(id)}`),
  addTrack: (playlistId: string, body: AddPlaylistTrackRequest) =>
    http.post<PlaylistTrackItem>(`/playlists/${encodeURIComponent(playlistId)}/tracks`, { body }),
  removeTrack: (playlistId: string, trackId: string) =>
    http.delete<{ success: boolean }>(
      `/playlists/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(trackId)}`,
    ),
  reorderTracks: (playlistId: string, body: ReorderPlaylistTracksRequest) =>
    http.patch<PlaylistDetails>(`/playlists/${encodeURIComponent(playlistId)}/tracks/reorder`, {
      body,
    }),
},
```

Після змін у `packages/*` обов'язково зібрати спільні пакети перед збіркою API/Web:

```bash
pnpm --filter ./packages/* build
```

---

## 4. Бекенд реалізація (`apps/api`)

### 4.1. Оновлення `LibraryModule` (`apps/api/src/modules/library/`)

1. **`LibraryService.addFavoriteTrack(userId, trackId)`**:
   - Отримує `track = await this.catalogService.getTrack(trackId)`.
   - У `prisma.favoriteTrack.upsert` зберігає також:
     - `titleVersion: track.titleVersion`
     - `explicit: track.explicit`
     - `artistProviderId: track.artist.providerId`
     - `albumProviderId: track.album.providerId`
     - `cover: track.album.cover` (JSON `ImageSet`), а `coverUrl: track.album.cover.small || null`
   - В `update` також оновлює метадані (на випадок, якщо старий запис не мав `artistProviderId` / `albumProviderId`).
2. **`LibraryService.getFavorites(userId, limit, offset)`**:
   - Мапить кожен запис у `FavoriteTrackSummary`:
     - Якщо в існуючому рядку відсутні `artistProviderId` або `albumProviderId`, виконує безпечне ліниве дозаповнення через `this.catalogService.getTrack(item.providerId)` (який кешований у Redis на 24 години) та фоново/транзакційно оновлює запис у БД, або фоллбеком повертає порожній рядок без падіння.
     - Формує `cover: ImageSet` з JSON-поля `item.cover` (або фоллбек з `item.coverUrl` для `small/medium/large/xl`).
     - Повертає `previewUrl: null` (актуальний `previewUrl` при відтворенні отримує `PlayerService.play()`).

### 4.2. Новий `PlaylistsModule` (`apps/api/src/modules/playlists/`)

#### Модульна структура

```text
apps/api/src/modules/playlists/
├── dto/
│   ├── add-playlist-track.dto.ts
│   ├── create-playlist.dto.ts
│   ├── list-playlists-query.dto.ts
│   ├── reorder-playlist-tracks.dto.ts
│   └── update-playlist.dto.ts
├── playlists.controller.ts
├── playlists.module.ts
├── playlists.service.ts
└── playlists.service.spec.ts
```

`PlaylistsModule` імпортує `AuthModule` і `CatalogModule`, експортує `PlaylistsService`, і підключається в `AppModule` (`apps/api/src/app.module.ts`).

#### REST API ендпоінти

Усі маршрути захищені `@UseGuards(JwtAuthGuard)` та використовують `@CurrentUser() user: UserWithProfileEntity`.

| Метод    | Шлях                                 | Query / Body                                                           | Успіх | Коди помилок               | Опис                                                                   |
| -------- | ------------------------------------ | ---------------------------------------------------------------------- | ----- | -------------------------- | ---------------------------------------------------------------------- |
| `GET`    | `/api/playlists`                     | `limit`, `offset`, `trackId?`                                          | `200` | `401`                      | Список плейлистів поточного користувача (`Paginated<PlaylistSummary>`) |
| `POST`   | `/api/playlists`                     | `CreatePlaylistDto` (`title`, `description?`, `isPublic?`, `trackId?`) | `201` | `400`, `401`, `404`        | Створити плейлист (і за наявності `trackId` — одразу додати трек)      |
| `GET`    | `/api/playlists/:id`                 | Param `id` (UUID)                                                      | `200` | `400`, `401`, `403`, `404` | Деталі плейлиста та впорядкований список треків                        |
| `PATCH`  | `/api/playlists/:id`                 | `UpdatePlaylistDto`                                                    | `200` | `400`, `401`, `403`, `404` | Оновити назву / опис / видимість (лише власник)                        |
| `DELETE` | `/api/playlists/:id`                 | Param `id` (UUID)                                                      | `200` | `400`, `401`, `403`, `404` | Видалити плейлист (лише власник)                                       |
| `POST`   | `/api/playlists/:id/tracks`          | `AddPlaylistTrackDto` (`trackId`)                                      | `201` | `400`, `401`, `403`, `404` | Додати трек у кінець плейлиста                                         |
| `DELETE` | `/api/playlists/:id/tracks/:trackId` | Params `id` (UUID), `trackId` (providerId)                             | `200` | `400`, `401`, `403`, `404` | Видалити трек із плейлиста                                             |
| `PATCH`  | `/api/playlists/:id/tracks/reorder`  | `ReorderPlaylistTracksRequest` (`trackIds`)                            | `200` | `400`, `401`, `403`, `404` | Змінити порядок треків у плейлисті                                     |

#### Валідація параметрів та DTO

- Для `:id` використовувати `ParseUUIDPipe` (`@Param('id', ParseUUIDPipe) id: string`), щоб некоректні UUID повертали `400 Bad Request` замість 500 помилки Prisma.
- `CreatePlaylistDto`:
  - `title`: `@IsString() @Transform(({ value }) => value?.trim()) @MinLength(1) @MaxLength(100)`
  - `description`: `@IsOptional() @IsString() @MaxLength(500)`
  - `isPublic`: `@IsOptional() @IsBoolean()`
  - `trackId`: `@IsOptional() @IsString() @MinLength(1)`
- `ListPlaylistsQueryDto extends PaginationQueryDto`:
  - `trackId?: string` — дозволяє при запиті `GET /api/playlists?trackId=123` повернути у кожному `PlaylistSummary` прапор `containsTrack: boolean` для модального вікна «Додати до плейлиста».
- `AddPlaylistTrackDto`:
  - `trackId`: `@IsString() @IsNotEmpty()` (Deezer `providerId`).
- `ReorderPlaylistTracksDto`:
  - `trackIds`: `@IsArray() @ArrayNotEmpty() @IsString({ each: true })` (Deezer `providerId` у новому порядку).

#### Бізнес-логіка та транзакції (`PlaylistsService`)

1. **Upsert каталожних сутностей при додаванні треку (`ensureTrackPersisted`):**
   - Спочатку викликаємо `const trackDetails = await this.catalogService.getTrack(trackId)` (поза транзакцією БД, щоб не тримати з'єднання PostgreSQL під час зовнішнього HTTP-запиту!).
   - Якщо трек не знайдено — `NotFoundException`.
   - Усередині `this.prisma.$transaction(async (tx) => { ... })`:
     1. `tx.artist.upsert({ where: { provider_providerId: { provider: 'DEEZER', providerId: trackDetails.artist.providerId } }, create: { ... }, update: { name: trackDetails.artist.name } })`
     2. `tx.album.upsert({ where: { provider_providerId: { provider: 'DEEZER', providerId: trackDetails.album.providerId } }, create: { ..., artistId: artist.id, cover: trackDetails.album.cover }, update: { title: trackDetails.album.title, cover: trackDetails.album.cover } })`
     3. `tx.track.upsert({ where: { provider_providerId: { provider: 'DEEZER', providerId: trackDetails.providerId } }, create: { ..., artistId: artist.id, albumId: album.id, previewUrl: null }, update: { title: trackDetails.title, titleVersion: trackDetails.titleVersion, duration: trackDetails.duration, explicit: trackDetails.explicit } })`
     4. Перевірка, чи є вже `PlaylistTrack` з `(playlistId, track.id)`. Якщо вже є — повертаємо існуючий запис ідемпотентно (без дубліката та помилки).
     5. Знаходимо `aggregate({ _max: { position: true } })` по `playlistId`, задаємо `position = (max._max.position ?? -1) + 1`, створюємо `PlaylistTrack` і оновлюємо `playlist.updatedAt`.
2. **Створення плейлиста з опціональним `trackId`:**
   - Якщо передано `trackId`, спочатку валідуємо трек через `catalogService.getTrack(trackId)`.
   - У `prisma.$transaction` створюємо `Playlist` і (якщо є `trackId`) додаємо перший `PlaylistTrack` з `position = 0`.
3. **Видалення треку та компактність позицій:**
   - Видаляємо `PlaylistTrack` за `(playlistId, track.id)` (знайшовши `track` за `(DEEZER, trackId)`).
   - Якщо трек існував у плейлисті, в транзакції оновлюємо позиції решти треків `0..N-1` (або впорядковуємо за `position: 'asc'`).
4. **Безпека та права доступу:**
   - `GET /api/playlists/:id`: дозволено власнику (`playlist.userId === userId`) або якщо `playlist.isPublic === true`; інакше `ForbiddenException` (`403`). Якщо не знайдено — `NotFoundException` (`404`).
   - `PATCH`, `DELETE`, `POST .../tracks`, `DELETE .../tracks/:trackId`, `PATCH .../reorder`: дозволено **тільки власнику** (`playlist.userId === userId`), інакше `ForbiddenException` (`403`).
5. **Обкладинка плейлиста (`cover`):**
   - Якщо `playlist.coverUrl` заданий, формуємо `ImageSet` з нього; інакше беремо `cover` першого треку плейлиста (за `position: 0`) або `null` (на фронті показується стилізований плейсхолдер).
6. **Кешування в Redis:**
   - Дані плейлистів є локальними легкими SQL-запитами в PostgreSQL (без звернень до Deezer API), при цьому вони часто мутуються (додавання/видалення треків). Згідно з `ONBOARDING.md` 5.4, Redis не є джерелом істини. Для `GET /api/playlists/:id` можна кешувати деталі під ключем `playlists:detail:${id}` (TTL 300 с) з негайною інвалідацією `cache.del(...)` при будь-якому `update`, `remove`, `addTrack`, `removeTrack`, `reorderTracks` — або читати напряму з PostgreSQL без ризику розсинхрону кешу. Рекомендований варіант для v1: пряме читання з PostgreSQL (простіше, менше коду інвалідації, нульовий ризик stale стану в модалці додавання треків).

### 4.3. Оновлення `PlayerModule` (`apps/api/src/modules/player/`)

Цей пункт є критично важливим для вимоги **«треки в плейлисті грають по порядку»**.

1. **`PlayTrackDto` (`apps/api/src/modules/player/dto/play-track.dto.ts`):**
   - Оновити `@ApiProperty({ enum: ['search', 'artist', 'album', 'playlist', 'collection', 'favorites'] })` та `@IsIn(['search', 'artist', 'album', 'playlist', 'collection', 'favorites'])`.
2. **`PlayerQueueService` (`apps/api/src/modules/player/player-queue.service.ts`):**
   - Додати обробку `context?.type === 'playlist' && context.id && userId`:
     - Завантажити плейлист з `tracks` (`orderBy: { position: 'asc' }`, включаючи `track: { include: { artist: true, album: true } }`), перевірити `playlist.userId === userId || playlist.isPublic`.
     - Перетворити у `TrackSummary[]`.
     - Знайти індекс `currentTrack.providerId`: додати у `candidates` усі треки після нього (`slice(trackIdx + 1)`).
   - Додати обробку `context?.type === 'favorites' && userId`:
     - Завантажити `prisma.favoriteTrack.findMany({ where: { userId, provider: 'DEEZER' }, orderBy: { createdAt: 'desc' }, take: 100 })`.
     - Мапити у `TrackSummary[]`, знайти `currentTrack.providerId` і взяти `slice(trackIdx + 1)`.
   - **Критичне виправлення фільтрації прев'ю у `PlayerQueueService`:**
     - У поточній реалізації рядок `if (track.previewUrl && !seen.has(track.providerId))` відкидає всі треки, в яких `previewUrl === null`.
     - Оскільки `PlaylistTrack` (таблиця `tracks`) та `FavoriteTrack` **не зберігають** тимчасові підписані URL Deezer (`previewUrl: null`), старий фільтр відкидав би всю чергу плейлиста!
     - Вирішення: для `const allowLazyPreview = context?.type === 'playlist' || context?.type === 'favorites'` дозволяти треки в черзі незалежно від наявності `track.previewUrl` (`(allowLazyPreview || track.previewUrl) && !seen.has(track.providerId)`), тому що `PlayerService.next()` і `PlayerService.previous()` перед поверненням треку на клієнт **завжди** викликають `this.withFreshPreview(queued)` (через `catalogService.getFreshTrack`).
   - Також для строго впорядкованого плейлиста (`context.type === 'playlist'`): якщо в плейлисті всього 3–4 треки, не варто підмішувати в чергу сторонні треки fallback-у (або підмішувати лише після закінчення всіх треків плейлиста — поточний код додає `candidates` після треків контексту, тому треки плейлиста завжди йдуть першими по порядку!).
3. **`PlayerService` (`apps/api/src/modules/player/player.service.ts`):**
   - Додати `'favorites'` в `ORDERED_CONTEXTS`:
     `const ORDERED_CONTEXTS = new Set<PlayerContext['type']>(['collection', 'album', 'playlist', 'favorites'])`.
   - У методі `play(userId, trackId, context)`:
     - Розширити заповнення `history` попередніми треками (як це вже зроблено для `'collection'` у рядках 69–90): якщо `context?.type === 'playlist'` або `'favorites'`, додати треки, що йдуть перед обраним треком, у `history` (без фільтра `.filter((t) => !!t.previewUrl)`, щоб кнопка «Previous» працювала по всьому плейлисту!).

### 4.4. План тестування бекенду

- **Unit-тести:**
  - `apps/api/src/modules/playlists/playlists.service.spec.ts`:
    - Створення плейлиста (з `trackId` і без), перевірка тримінгу назви.
    - Заборона доступу (`ForbiddenException`) чужому користувачу на приватний плейлист та на будь-які мутації.
    - Upsert `Artist` / `Album` / `Track` у транзакції та інкремент `position`.
    - Ідемпотентне додавання того самого треку.
    - Видалення треку з перерахунком позицій.
  - `apps/api/src/modules/library/library.service.spec.ts`:
    - Збереження `artistProviderId`, `albumProviderId`, `cover` та мапінг у `FavoriteTrackSummary`.
  - `apps/api/src/modules/player/player.service.spec.ts`:
    - Черга з контекстом `{ type: 'playlist', id }` відтворює треки строго по порядку `position`, навіть якщо `previewUrl` у БД дорівнює `null`.
    - Черга з контекстом `{ type: 'favorites' }` відтворює обрані треки по порядку.
- **E2E-тести (`apps/api/test/`):**
  - `playlists.e2e-spec.ts`: повний цикл `POST /api/playlists` → `POST /api/playlists/:id/tracks` → `GET /api/playlists/:id` → `PATCH` → `DELETE .../tracks/:trackId` → `DELETE /api/playlists/:id` + перевірка 401/403/404.

---

## 5. Фронтенд реалізація (`apps/web`)

### 5.1. FSD структура та межі залежностей

Дотримуємося правила `shared ← entities ← features ← widgets ← pages ← app`:

```text
apps/web/src/
├── shared/
│   └── api/
│       └── query-keys.ts                  # гілки library та playlists
├── entities/
│   ├── track/
│   │   └── ui/TrackRow.vue                # додаємо слот #actions (права колонка)
│   └── playlist/
│       ├── index.ts
│       └── ui/PlaylistCard.vue            # картка плейлиста для сітки
├── features/
│   ├── library/
│   │   ├── index.ts
│   │   └── model/
│   │       └── use-favorites.query.ts     # useFavoritesQuery, useFavoriteStatusQuery, useToggleFavoriteMutation
│   ├── playlists/
│   │   ├── index.ts
│   │   ├── model/
│   │   │   ├── use-playlists.query.ts     # queries + mutations (CRUD, add/remove track)
│   │   │   └── playlist-modal.store.ts    # Pinia UI-стан для спільних діалогів (AddToPlaylist / CreatePlaylist)
│   │   └── ui/
│   │       ├── AddToPlaylistDialog.vue    # вибір плейлиста + кнопка «Створити новий плейлист»
│   │       └── CreatePlaylistDialog.vue   # створення/редагування плейлиста (vee-validate + zod)
│   └── player/
│       └── model/
│           └── player.store.ts            # + isExpanded, openExpanded, closeExpanded, інвалідація favorites при toggleLike
├── widgets/
│   ├── track-menu/
│   │   ├── index.ts
│   │   └── ui/TrackMenu.vue               # кнопка ⋮ + popup меню (компонує library, playlists, router)
│   ├── music-player/
│   │   ├── index.ts
│   │   └── ui/
│   │       ├── MusicPlayer.vue            # клік для розгортання, @click.stop на контролах
│   │       └── ExpandedPlayer.vue         # повноекранний плеєр з великим фото та 5 діями
│   ├── search-results/ui/SearchResults.vue        # передає <TrackMenu> у #actions
│   └── recommendation-section/ui/RecommendationSection.vue # міграція на TrackRow / додавання TrackMenu
├── pages/
│   └── app/
│       ├── library/ui/LibraryPage.vue     # реальне Обране + список Плейлистів
│       ├── playlist/ui/PlaylistPage.vue   # сторінка плейлиста + Play у порядку треків
│       ├── artist/ui/ArtistPage.vue       # передає <TrackMenu> у #actions
│       └── album/ui/AlbumPage.vue         # передає <TrackMenu> у #actions
└── app/
    └── layouts/AppLayout.vue              # монтує глобальні AddToPlaylistDialog + CreatePlaylistDialog
```

> [!IMPORTANT]
> **`entities/track` не імпортує `features/*`!**  
> `TrackRow.vue` залишається чистим entity-компонентом і приймає дії через `<slot name="actions" />`. Композиція `TrackRow` + `TrackMenu` відбувається у `widgets/` (`SearchResults.vue`, `RecommendationSection.vue`) та `pages/` (`ArtistPage.vue`, `AlbumPage.vue`, `LibraryPage.vue`, `PlaylistPage.vue`).

### 5.2. Маршрутизація (`apps/web/src/app/router/routes.ts`)

Перевірити наявність маршрутів:

- `ROUTE_NAMES.library` (`/app/library`) — сторінка «Обране».
- `ROUTE_NAMES.playlists` (`/app/library/playlists`) — сторінка зі списком плейлистів (уже додано в `task-5`).
- `ROUTE_NAMES.playlist` (`/app/playlist/:id`) — сторінка конкретного плейлиста (уже існує).
- `ROUTE_NAMES.artist` (`/app/artist/:id`) — сторінка автора.
- `ROUTE_NAMES.album` (`/app/album/:id`) — сторінка альбому.

Усі маршрути знаходяться під `AppLayout` із `meta: { requiresAuth: true }`.

### 5.3. State Management (TanStack Query та Pinia)

#### 1) Query Keys (`apps/web/src/shared/api/query-keys.ts`)

```ts
library: {
  all: ['library'] as const,
  favoritesRoot: ['library', 'favorites'] as const,
  favorites: (limit: number, offset: number) =>
    ['library', 'favorites', 'list', limit, offset] as const,
  favoriteStatusRoot: ['library', 'favorites', 'status'] as const,
  favoriteStatus: (ids: string[]) =>
    ['library', 'favorites', 'status', [...ids].sort().join(',')] as const,
},
playlists: {
  all: ['playlists'] as const,
  list: (trackId?: string) => ['playlists', 'list', trackId ?? 'all'] as const,
  detail: (id: string) => ['playlists', 'detail', id] as const,
},
```

#### 2) Синхронізація Обраного (`features/library` + `player.store.ts`)

- **`useFavoritesQuery(limit, offset)`**: завантажує `api.library.getFavorites({ limit, offset })`.
- **`useFavoriteStatusQuery(trackIds)`**: приймає реактивний масив `providerId` видимого списку (дедуплікований і непорожній) та запитує `api.library.getFavoriteStatus(ids)`.
- **`useToggleFavoriteMutation()`**:
  - Приймає `{ trackId: string, isCurrentlyLiked: boolean }`.
  - Викликає `api.library.addFavoriteTrack(trackId)` або `removeFavoriteTrack(trackId)`.
  - У `onSuccess`:
    - Якщо `playerStore.currentTrack?.providerId === trackId`, синхронізує `playerStore.setLiked(!isCurrentlyLiked)`.
    - Інвалідує `queryKeys.library.favoritesRoot` (оновлює як списки обраного, так і всі статус-запити).
- **У `usePlayerStore.toggleLike()`**:
  - Додатково викликає `queryClient.invalidateQueries({ queryKey: queryKeys.library.favoritesRoot })` після успішної мутації, щоб при лайку/анлайку в плеєрі сторінка «Обране» та всі меню треків миттєво оновилися.

#### 3) Керування модалками плейлистів (`playlist-modal.store.ts` у `features/playlists`)

Щоб не монтувати десятки окремих `<Dialog>` всередині кожного `TrackRow` у списку з 50 пісень, стан модальних вікон виноситься в легкий Pinia UI-стор `usePlaylistModalStore`:

- `addTrackTarget = ref<TrackSummary | null>(null)` — трек, який користувач хоче додати до плейлиста (`null` = діалог закритий).
- `isCreateDialogOpen = ref(false)` — окремий діалог створення/редагування плейлиста (відкривається зі сторінки плейлистів або редагування).
- `editingPlaylist = ref<PlaylistSummary | null>(null)`.
- Методи: `openAddToPlaylist(track)`, `closeAddToPlaylist()`, `openCreatePlaylist()`, `openEditPlaylist(playlist)`, `closeCreatePlaylist()`.
- Самі компоненти `<AddToPlaylistDialog />` та `<CreatePlaylistDialog />` монтуються **один раз** у `AppLayout.vue`.

#### 4) Стан розгорнутого плеєра (`player.store.ts`)

У `usePlayerStore` додаємо:

- `const isExpanded = ref(false)`
- `function openExpanded() { if (currentTrack.value) isExpanded.value = true }`
- `function closeExpanded() { isExpanded.value = false }`
- `function toggleExpanded() { isExpanded.value = !isExpanded.value }`
- `function setLiked(val: boolean) { isLiked.value = val }`
- При зникненні `currentTrack` (або виході з профілю/онбордингу) `isExpanded.value = false`.

### 5.4. Детальна специфікація UI-компонентів

#### 1) `TrackRow.vue` (`apps/web/src/entities/track/ui/TrackRow.vue`)

- Оновити CSS-сітку з 5 колонок на 6 (з урахуванням optional слота `actions`):
  - Desktop: `grid-template-columns: 24px 44px minmax(0, 1fr) minmax(100px, 0.8fr) 45px 32px;`
  - Mobile (`max-width: 640px`): `grid-template-columns: 20px 40px minmax(0, 1fr) 40px 32px;` (приховує `.album`, але завжди залишає кнопку `⋮` доступною для тапа!).
- Додати обгортку для слота праворуч:
  ```html
  <div v-if="$slots.actions" class="track-actions" @click.stop>
    <slot name="actions" />
  </div>
  ```
- Порожній трек без `index` (`index === undefined`): передбачити коректну сітку або завжди передавати `index` у списках.

#### 2) `TrackMenu.vue` (`apps/web/src/widgets/track-menu/ui/TrackMenu.vue`)

- **Пропси:**
  - `track: TrackSummary`
  - `isLiked?: boolean` (якщо не передано — або підхоплюється з локального status-кешу `useFavoriteStatusQuery`, або передається зі списку; найкраще: підтримати необов'язковий проп `isLiked` і мати fallback на `useFavoriteStatusQuery` при відкритті меню, щоб кнопка завжди мала актуальний статус навіть на одиничному виклику).
  - `playlistId?: string` (передається на `PlaylistPage.vue`, якщо поточний користувач є власником плейлиста, щоб показати пункт «Видалити з плейлиста»).
- **Тригер:** кнопка `<button type="button" class="track-menu-btn" aria-label="Track options" @click.stop="toggleMenu">` з іконкою `<IconDotsVertical :size="18" />` з `@tabler/icons-vue`.
- **Popup-меню:** компонент PrimeVue `<Menu ref="menuRef" :model="menuItems" :popup="true" />` (або стилізований `Popover`), оформлений у темній темі Sonora (`--sonora-surface`, рамка `#2b2b32`, hover `#25252e`, текст `--sonora-text`).
- **Пункти меню:**
  1. **Додати до обраного / Видалити з обраного** (`IconHeart` / `IconHeartOff`): викликає `toggleFavorite`.
  2. **Додати до плейлиста** (`IconPlaylistAdd`): викликає `playlistModalStore.openAddToPlaylist(props.track)`.
  3. _(За наявності `playlistId`)_ **Видалити з плейлиста** (`IconTrash`): викликає `removeTrackFromPlaylistMutation`.
  4. **Перейти до автора** (`IconUser`): `router.push({ name: ROUTE_NAMES.artist, params: { id: props.track.artist.providerId } })` (disabled, якщо `artist.providerId` порожній).
  5. **Перейти до альбому** (`IconDisc`): `router.push({ name: ROUTE_NAMES.album, params: { id: props.track.album.providerId } })` (disabled, якщо `album.providerId` порожній).

#### 3) `AddToPlaylistDialog.vue` (`apps/web/src/features/playlists/ui/AddToPlaylistDialog.vue`)

- PrimeVue `<Dialog v-model:visible="isOpen" modal header="Add to playlist" :style="{ width: 'min(440px, 92vw)' }">` (z-index вище `ExpandedPlayer`, щоб коректно відкриватися поверх нього!).
- **Вміст:**
  - Міні-картка обраного треку (обкладинка, назва, артист).
  - Запит `usePlaylistsQuery(trackId)` — завантажує плейлисти користувача з прапорцем `containsTrack`.
  - **Список плейлистів користувача:**
    - Кожен елемент — кнопка-рядок із міні-обкладинкою (`40x40`), назвою плейлиста, кількістю треків та іконкою-галочкою (`IconCheck` у `--sonora-accent`), якщо трек уже в цьому плейлисті.
    - Клік по плейлисту, де треку ще немає → викликає `addTrackMutation({ playlistId, trackId })`, показує індикатор завантаження і по завершенні позначає галочкою (або закриває діалог з коротким повідомленням).
    - Якщо плейлистів ще немає → підказка «You don't have any playlists yet».
  - **Кнопка «Створити новий плейлист» («Create new playlist»):**
    - Знаходиться у видимій частині діалогу (кнопка з `IconPlus`).
    - По кліку перемикає внутрішній режим діалогу (`isCreatingNew = true`) — показує компактну форму (`vee-validate` + `zod`: `title` 1..100 символів, `description` опціонально) із кнопками «Back» та «Create & Add».
    - При сабміті викликає `POST /api/playlists` з `{ title, description, trackId: track.providerId }` — за один запит створює плейлист, додає в нього трек, інвалідує кеш `queryKeys.playlists.all` і повертає користувача або закриває діалог.

#### 4) `CreatePlaylistDialog.vue` (`apps/web/src/features/playlists/ui/CreatePlaylistDialog.vue`)

- Використовується зі сторінки списку плейлистів (кнопка «Створити плейлист») або зі сторінки плейлиста (кнопка «Редагувати»).
- Валідація через `vee-validate` + `zod` (без `@vee-validate/zod`, через Standard Schema як в `ONBOARDING.md`):
  - `title`: обов'язковий, `min(1)`, `max(100)`.
  - `description`: опціональний, `max(500)`.
  - `isPublic`: `boolean` перемикач (за замовчуванням `false`).

#### 5) `ExpandedPlayer.vue` та `MusicPlayer.vue` (`apps/web/src/widgets/music-player/ui/`)

- **Зміни в `MusicPlayer.vue`:**
  - Контейнер `.player-track` отримує `role="button"`, `tabindex="0"`, `cursor: pointer`, `@click="playerStore.openExpanded()"` + окрема кнопка-іконка `IconChevronUp` (`aria-label="Expand player"`) поруч з `.player-heart` або праворуч у `.player-actions`.
  - Усі внутрішні інтерактивні кнопки/слайдери (`.player-heart`, `.control-buttons button`, `.progress-line`, `.volume-btn`, `.volume-line`) мають `@click.stop`, щоб не провокувати випадкове розгортання при кліку по Play/Pause або сердечку.
  - На мобільному екрані (`max-width: 640px`) тап по `.player-track` відкриває розгорнутий плеєр з повними контролами (seekbar, next/prev, гучність, дії).
  - Усередині `MusicPlayer.vue` (або в `AppLayout.vue`) рендериться `<ExpandedPlayer v-if="playerStore.isExpanded" />` (з `<Teleport to="body">` і `<Transition name="expanded-player">`).
- **Макет та логіка `ExpandedPlayer.vue`:**
  - Фіксований оверлей `position: fixed; inset: 0; z-index: 50; background: var(--sonora-bg);` з м'яким розмитим фоном із кольорів обкладинки (`backdrop-filter: blur(48px)` + затемнення `rgba(11, 11, 15, 0.86)`).
  - Верхня панель: кнопка згортання (`IconChevronDown`, `aria-label="Collapse player"`), контекст відтворення (наприклад, `Playing from Playlist` / `Playing from Search`). Закриття також працює по клавіші `Escape` (`onKeyStroke` з `@vueuse/core`).
  - Центральна частина:
    - **Велике фото пісні:** `cover.xl || cover.large || cover.medium` (`width: min(360px, 78vw); aspect-ratio: 1; border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.6)`). Fallback `.artwork` при відсутності фото.
    - Назва треку (`clamp(22px, 3vw, 32px)`), ім'я автора та назва альбому.
  - Блок керування плеєром:
    - Інтерактивний seekbar (поточний час зліва `0:12`, загальна тривалість справа `0:30`).
    - Кнопки `Previous`, велика акцентна `Play / Pause`, `Next`.
    - Слайдер гучності / кнопка Mute (десктоп).
  - **Панель 5 дій:**
    1. **Обране (`playerStore.toggleLike()`):** іконка `IconHeart` (зафарбована `--sonora-accent`, якщо `playerStore.isLiked`), підпис `Favorite` / `Favorited`.
    2. **Додати до плейлиста:** іконка `IconPlaylistAdd`, відкриває `playlistModalStore.openAddToPlaylist(playerStore.currentTrack)`.
    3. **Перейти до автора:** іконка `IconUser`, викликає `playerStore.closeExpanded()` і `router.push({ name: ROUTE_NAMES.artist, params: { id: track.artist.providerId } })` (disabled якщо немає ID).
    4. **Перейти до альбому:** іконка `IconDisc`, викликає `playerStore.closeExpanded()` і `router.push({ name: ROUTE_NAMES.album, params: { id: track.album.providerId } })` (disabled якщо немає ID).
    5. **Поділитися:** іконка `IconShare`, формує URL:
       - якщо `track.album.providerId` є: `${window.location.origin}/app/album/${track.album.providerId}?track=${track.providerId}`
       - інакше: `${window.location.origin}/app/search?q=${encodeURIComponent(`${track.title} ${track.artist.name}`)}`
       - Намагається викликати `navigator.share({ title: track.title, text: `${track.title} — ${track.artist.name}`, url })`, якщо не підтримується (або відхилено не через `AbortError`) — копіює посилання в буфер обміну через `navigator.clipboard.writeText(url)` і на 2 секунди змінює іконку/текст кнопки на `IconCheck` / `Link copied!`.

#### 6) Сторінки `LibraryPage.vue` та `PlaylistPage.vue`

- **`LibraryPage.vue` (`apps/web/src/pages/app/library/ui/LibraryPage.vue`):**
  - **Вкладка / маршрут `ROUTE_NAMES.library` («Обране»):**
    - Використовує `useFavoritesQuery(50, 0)`.
    - Показує заголовок, лічильник треків і кнопку `Play` (запускає перший трек з `{ type: 'favorites' }`).
    - Рендерить `TrackRow` для кожного треку (індекс 0..N, передаючи `#actions` з `<TrackMenu :track="track" :is-liked="true" />`).
    - Стани: loading (спінер/скелетон), error (повідомлення + «Try again»), empty (існуючий `.empty-state` з орбітою та посиланням на пошук).
  - **Вкладка / маршрут `ROUTE_NAMES.playlists` («Плейлисти»):**
    - Використовує `usePlaylistsQuery()`.
    - У шапці сторінки кнопка `+ Create playlist` (`playlistModalStore.openCreatePlaylist()`).
    - Сітка `<PlaylistCard v-for="playlist in playlists" :key="playlist.id" :playlist="playlist" />` (`repeat(auto-fill, minmax(180px, 1fr))`).
    - Порожній стан з CTA кнопкою «Create playlist».
- **`PlaylistPage.vue` (`apps/web/src/pages/app/playlist/ui/PlaylistPage.vue`):**
  - Отримує `id` з `route.params.id` та викликає `usePlaylistQuery(id)`.
  - **Hero-секція:** обкладинка плейлиста (`220x220`, або стильна мозаїка/плейсхолдер), eyebrow `PLAYLIST`, назва (`h1`), опис, кількість треків і загальна тривалість.
  - **Дії в шапці:**
    - Кнопка `Play` (відтворює перший трек з `{ type: 'playlist', id: playlist.id }`, якщо в плейлисті є треки; якщо зараз грає саме цей плейлист — `togglePlay()`).
    - Кнопка `Share` (копіює посилання `${origin}/app/playlist/${playlist.id}`).
    - Для власника (`playlist.isOwner`): кнопки `Edit` (відкриває `CreatePlaylistDialog` у режимі редагування) та `Delete` (із підтвердженням та редіректом на `ROUTE_NAMES.playlists`).
  - **Список треків:**
    - `TrackRow` з `:index="index"`, `@play="onPlayTrack(track)"` (передає `{ type: 'playlist', id: playlist.id }`).
    - У `#actions`: `<TrackMenu :track="track" :is-liked="favoriteStatus[track.providerId]" :playlist-id="playlist.isOwner ? playlist.id : undefined" />`.
  - **Обробка помилок:** окремий екран для `404` («Playlist not found»), `403` («This playlist is private»), мережевої помилки («Try again») та порожнього плейлиста («No tracks in this playlist yet» + кнопка в Search).

#### 7) Уніфікація списків треків на існуючих сторінках

Для дотримання вимоги **«У кожної пісні в списках з'являється іконка трьох вертикальних точок»**:

- `SearchResults.vue`: підключити `useFavoriteStatusQuery` для масиву `tracks` та передати `<TrackMenu>` у `#actions` для кожного `TrackRow`.
- `ArtistPage.vue`: підключити `useFavoriteStatusQuery` для `topTracks.items` та передати `<TrackMenu>` у `#actions`.
- `AlbumPage.vue`: підключити `useFavoriteStatusQuery` для `album.tracks` та передати `<TrackMenu>` у `#actions`.
- `RecommendationSection.vue` (головна сторінка): замінити вбудовану розмітку `.track` на перевикористання `<TrackRow>` з `<TrackMenu>` у `#actions` (або додати 5-ту колонку з `<TrackMenu>`), підключивши `useFavoriteStatusQuery` для списку рекомендацій. Перевикористання `TrackRow` прибере дублювання стилів та поведінки.

### 5.5. Тестування фронтенду

- **Vitest (unit & component tests):**
  - `player.store.spec.ts`: перевірити `openExpanded`, `closeExpanded`, збереження стану відтворення при зміні `isExpanded`, інвалідацію кешу при `toggleLike`.
  - `TrackMenu.spec.ts`: перевірити відображення пунктів меню (toggle «Add/Remove favorites», «Add to playlist», навігація на автора/альбом, опційний «Remove from playlist»).
  - `AddToPlaylistDialog.spec.ts`: перевірити список плейлистів, індикатор вже доданого треку, сценарій «Create new playlist» -> `create({ ..., trackId })`.
  - `ExpandedPlayer.spec.ts`: перевірити рендер великої обкладинки, кліки по діях, кнопку Share (clipboard fallback).
- **Playwright E2E (`apps/web/e2e/`):**
  - Сценарій: лайк треку через меню треку → перехід на `/app/library` (відображення треку) → анлайк → зникнення зі списку.
  - Сценарій: меню треку → «Додати до плейлиста» → «Створити новий плейлист» → перехід на `/app/library/playlists` → відкриття `/app/playlist/:id` → запуск треку.
  - Сценарій: клік на міні-плеєр → розгортання `ExpandedPlayer` → перехід до автора без зупинки аудіо.

---

## 6. Покроковий план впровадження (Implementation Tasks)

### Крок 1. База даних (`apps/api/prisma`)

- [ ] Оновити `FavoriteTrack` у `apps/api/prisma/schema.prisma` (додати `artistProviderId`, `albumProviderId`, `titleVersion`, `explicit`, `cover`).
- [ ] Додати моделі `Playlist` та `PlaylistTrack` та зв'язки у `User` і `Track`.
- [ ] Створити і застосувати міграцію `add_playlists_and_favorite_metadata`, згенерувати Prisma Client.

### Крок 2. Спільні типи та API-клієнт (`packages/*`)

- [ ] Оновити `packages/shared-types/src/library.ts` та `src/player.ts`.
- [ ] Додати `packages/shared-types/src/playlists.ts` та реекспортувати в `src/index.ts`.
- [ ] Додати namespace `playlists` у `packages/api-client/src/client.ts`.
- [ ] Зібрати пакети: `pnpm --filter ./packages/* build`.

### Крок 3. Бекенд (`apps/api`)

- [ ] Оновити `LibraryService` (`addFavoriteTrack`, `getFavorites` з новими полями та fallback-збагаченням).
- [ ] Створити `PlaylistsModule` (`playlists.module.ts`, `playlists.controller.ts`, `playlists.service.ts`, DTOs) і підключити в `AppModule`.
- [ ] Оновити `PlayTrackDto`, `PlayerService` та `PlayerQueueService` для впорядкованого відтворення `'playlist'` та `'favorites'` (враховуючи `previewUrl: null` у БД).
- [ ] Написати unit-тести (`playlists.service.spec.ts`, оновити `player.service.spec.ts`) та e2e-тести (`playlists.e2e-spec.ts`).

### Крок 4. Фронтенд — Features та Entities (`apps/web`)

- [ ] Додати гілки `library` та `playlists` у `apps/web/src/shared/api/query-keys.ts`.
- [ ] Оновити `TrackRow.vue` (слот `#actions`, responsive-сітка).
- [ ] Створити `entities/playlist/ui/PlaylistCard.vue`.
- [ ] Створити `features/library` (`useFavoritesQuery`, `useFavoriteStatusQuery`, `useToggleFavoriteMutation`).
- [ ] Створити `features/playlists` (`use-playlists.query.ts`, `playlist-modal.store.ts`, `AddToPlaylistDialog.vue`, `CreatePlaylistDialog.vue`).
- [ ] Оновити `usePlayerStore` (`isExpanded`, `openExpanded`, `closeExpanded`, `setLiked`, інвалідація запитів при `toggleLike`).

### Крок 5. Фронтенд — Widgets та Pages (`apps/web`)

- [ ] Створити `widgets/track-menu/ui/TrackMenu.vue`.
- [ ] Створити `widgets/music-player/ui/ExpandedPlayer.vue` та оновити `MusicPlayer.vue` (розгортання без переривання музики).
- [ ] Підключити `AddToPlaylistDialog` і `CreatePlaylistDialog` в `AppLayout.vue`.
- [ ] Оновити `LibraryPage.vue` (реальний список «Обране» та сітка «Плейлисти»).
- [ ] Реалізувати `PlaylistPage.vue` (герой, Play у порядку треків, Edit/Delete/Share, треклист із видаленням треків).
- [ ] Інтегрувати `TrackMenu` та `useFavoriteStatusQuery` у `SearchResults.vue`, `RecommendationSection.vue`, `ArtistPage.vue`, `AlbumPage.vue`.

### Крок 6. Тестування та перевірка

- [ ] Написати Vitest компонентні та store-тести.
- [ ] Додати Playwright e2e перевірки основних сценаріїв.
- [ ] Прогнати всі перевірки монорепозиторію.

---

## 7. Definition of Done (Критерії готовності)

- [ ] Міграція Prisma застосована (`add_playlists_and_favorite_metadata`), Prisma Client перегенерований.
- [ ] Спільні пакети зібрані (`pnpm --filter ./packages/* build`).
- [ ] На сторінці «Обране» відображаються реальні лайкнуті треки з можливістю запуску, видалення з обраного та навігації до автора/альбому.
- [ ] Можна створити плейлист, додати в нього пісню, відкрити список плейлистів та сторінку плейлиста; треки в плейлисті грають по порядку.
- [ ] У всіх списках треків присутнє меню з трьох вертикальних крапок з усіма 4 обов'язковими діями (Обране, Плейлист + створення нового, Автор, Альбом).
- [ ] По кліку на плеєр відкривається розгорнутий плеєр з великою обкладинкою та всіма 5 діями, музика під час відкриття/закриття/навігації не переривається.
- [ ] Бекенд тести пройдені (`pnpm --filter @music-app/api test`).
- [ ] Фронтенд тести пройдені (`pnpm --filter @music-app/web test`).
- [ ] Лінтер, typecheck і збірка проходять без помилок (`pnpm lint`, `pnpm typecheck`, `pnpm build`).
- [ ] Код відформатовано (`pnpm format:check`).
