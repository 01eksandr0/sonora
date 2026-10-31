# Технічний дизайн: Задача 2 — Підключення Deezer API та ротація токенів

**Гілка:** `tech-design-2`  
**Статус:** Чернетка для реалізації  
**Автор:** Джуніор розробник

---

## 1. Що потрібно зробити (мета задачі)

Sonora потрібне джерело музики — пошук треків, альбомів, виконавців, жанрів і чартів, а також 30-секундні аудіо-прев'ю для прослуховування. Для цього ми підключаємо зовнішній сервіс **Deezer API**.

### Головні вимоги:

1. **Підключити Deezer API** через бекенд Sonora (`apps/api`). Фронтенд ніколи не звертається до Deezer напряму — всі запити йдуть через наш бекенд.
2. **Описати всі потрібні ендпоінти Deezer** (пошук, треки, альбоми, артисти, жанри, чарти) та створити типи даних для них.
3. **Перетворювати дані Deezer у наш формат (канонічні моделі Sonora)**, щоб якщо в майбутньому ми підключимо інший сервіс (наприклад, Tidal), фронтенд взагалі не довелося переписувати.
4. **Зробити перемикання між токенами (ротацію)** у разі перевищення ліміту запитів (`Quota limit exceeded`), щоб додаток не падав і користувач не бачив помилок.
5. **Кешувати відповіді в Redis**, щоб не смикати Deezer щоразу на однакові запити.

---

## 2. API ендпоінти Deezer та типи даних

Всі запити йдуть на базовий URL: `https://api.deezer.com`. Відповіді приходять у форматі JSON.

### 2.1. Список ендпоінтів, які ми використовуємо

| Дія                   | Ендпоінт Deezer           | Параметри                              | Що повертає                                                             |
| :-------------------- | :------------------------ | :------------------------------------- | :---------------------------------------------------------------------- |
| **Пошук**             | `GET /search`             | `q` (текст), `limit` (25), `index` (0) | Список знайдених треків, альбомів та артистів                           |
| **Пошук треків**      | `GET /search/track`       | `q`, `limit`, `index`                  | Тільки треки                                                            |
| **Пошук альбомів**    | `GET /search/album`       | `q`, `limit`, `index`                  | Тільки альбоми                                                          |
| **Пошук артистів**    | `GET /search/artist`      | `q`, `limit`, `index`                  | Тільки артисти                                                          |
| **Деталі треку**      | `GET /track/{id}`         | `{id}` (Deezer ID)                     | Хронометраж, посилання на 30с mp3 (`preview`), explicit, артист, альбом |
| **Деталі альбому**    | `GET /album/{id}`         | `{id}`                                 | Назва, обкладинки, дата релізу, список треків (`tracks.data`)           |
| **Треклист альбому**  | `GET /album/{id}/tracks`  | `{id}`, `limit`, `index`               | Треки обраного альбому                                                  |
| **Деталі артиста**    | `GET /artist/{id}`        | `{id}`                                 | Ім'я, фото різних розмірів, к-сть альбомів і фанів                      |
| **Топ треки артиста** | `GET /artist/{id}/top`    | `{id}`, `limit` (10)                   | Найпопулярніші треки виконавця                                          |
| **Альбоми артиста**   | `GET /artist/{id}/albums` | `{id}`, `limit`, `index`               | Дискографія артиста                                                     |
| **Список жанрів**     | `GET /genre`              | —                                      | Список усіх доступних жанрів з картинками                               |
| **Чарти**             | `GET /chart`              | —                                      | Топ-треки, топ-альбоми та топ-артисти                                   |

---

### 2.2. Як Deezer повідомляє про перевищення ліміту

> [!IMPORTANT]
> **Особливість Deezer:** При перевищенні ліміту запитів Deezer повертає статус **`200 OK`**, але всередині JSON приходить об'єкт помилки:
>
> ```json
> {
>   "error": {
>     "type": "Exception",
>     "message": "Quota limit exceeded",
>     "code": 4
>   }
> }
> ```
>
> Тому ми обов'язково перевіряємо поле `error.code === 4` у відповіді!

---

### 2.3. Основні типи Deezer (`deezer.types.ts`)

У `apps/api/src/infrastructure/providers/deezer/deezer.types.ts`:

```ts
// Обгортка пагінації Deezer
export interface DeezerPaginatedResponse<T> {
  data: T[]
  total: number
  next?: string
  prev?: string
}

// Помилка від Deezer
export interface DeezerErrorResponse {
  error: {
    type: string
    message: string
    code: number
  }
}

// Трек з Deezer
export interface DeezerTrackDto {
  id: number
  title: string
  title_version?: string
  duration: number
  preview: string | null // 30-секундне аудіо MP3
  explicit_lyrics: boolean
  rank?: number
  bpm?: number
  release_date?: string
  artist: { id: number; name: string; picture_medium?: string }
  album?: { id: number; title: string; cover_medium?: string; cover_big?: string }
}

// Альбом з Deezer
export interface DeezerAlbumDto {
  id: number
  title: string
  cover_small?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
  release_date?: string
  record_type?: string
  nb_tracks?: number
  duration?: number
  explicit_lyrics?: boolean
  artist?: { id: number; name: string }
  tracks?: DeezerPaginatedResponse<DeezerTrackDto>
}

// Артист з Deezer
export interface DeezerArtistDto {
  id: number
  name: string
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
  nb_album?: number
  nb_fan?: number
}

// Жанр з Deezer
export interface DeezerGenreDto {
  id: number
  name: string
  picture_medium?: string
}
```

---

### 2.4. Канонічні типи Sonora (у що перетворюємо дані)

У `packages/shared-types/src/catalog.ts`:

```ts
import type { ImageSet } from './image.js'
import type { Paginated } from './pagination.js'

export interface TrackSummary {
  provider: 'deezer'
  providerId: string
  title: string
  titleVersion: string | null
  duration: number
  previewUrl: string | null
  explicit: boolean
  artist: { provider: 'deezer'; providerId: string; name: string }
  album: { provider: 'deezer'; providerId: string; title: string; cover: ImageSet }
}

export interface TrackDetails extends TrackSummary {
  rank: number | null
  bpm: number | null
  releaseDate: string | null
}

export interface AlbumSummary {
  provider: 'deezer'
  providerId: string
  title: string
  artist: { provider: 'deezer'; providerId: string; name: string }
  cover: ImageSet
  releaseDate: string | null
}

export interface AlbumDetails extends AlbumSummary {
  tracksCount: number | null
  duration: number | null
  explicit: boolean
  tracks?: TrackSummary[]
}

export interface ArtistSummary {
  provider: 'deezer'
  providerId: string
  name: string
  images: ImageSet
}

export interface ArtistDetails extends ArtistSummary {
  albumsCount: number | null
  fansCount: number | null
}

export interface Genre {
  provider: 'deezer'
  providerId: string
  name: string
  images: ImageSet
}

export interface SearchResult {
  tracks: Paginated<TrackSummary>
  albums: Paginated<AlbumSummary>
  artists: Paginated<ArtistSummary>
}
```

---

## 3. Як працює перемикання між токенами (ротація)

### 3.1. Ідея простими словами

Deezer має ліміт: приблизно 50 запитів за 5 секунд на один IP або токен. Якщо користувачі активно шукають музику, ліміт швидко вичерпується.

Щоб цього уникнути:

1. У файлі `.env` зберігаємо список токенів через кому:
   ```env
   DEEZER_API_TOKENS="token_1,token_2,token_3"
   ```
   _(Якщо токенів немає — працюємо у звичайному режимі без токенів як fallback)._
2. Ми зберігаємо масив токенів і поточний індекс `currentIndex`.
3. Кожен токен має статус: `ACTIVE` або `COOLDOWN` (тимчасово заблокований) із таймером розблокування `cooldownUntil`.
4. Коли робимо запит:
   - Беремо перший доступний активний токен.
   - Додаємо його до запиту: `?access_token=...`.
   - Якщо Deezer повертає помилку квоти (`error.code === 4` або HTTP 429):
     - Ставимо цей токен на кулдаун (наприклад, на 30 секунд).
     - Логуємо: `[Deezer] Token throttled, switching to next token...`.
     - Беремо наступний токен зі списку і **повторюємо той самий запит**.
   - Користувач навіть не помічає затримки й отримує свої дані!

### 3.2. Простий код менеджера токенів (`deezer-token.manager.ts`)

```ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface TokenSlot {
  token: string
  cooldownUntil: number // час у мілісекундах
}

@Injectable()
export class DeezerTokenManager {
  private readonly logger = new Logger(DeezerTokenManager.name)
  private tokens: TokenSlot[] = []
  private currentIndex = 0

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('DEEZER_API_TOKENS', '')
    const list = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    this.tokens = list.map((token) => ({ token, cooldownUntil: 0 }))
    if (this.tokens.length === 0) {
      this.tokens.push({ token: '', cooldownUntil: 0 }) // публічний режим без токена
    }
  }

  // Отримати доступний токен
  getToken(): string {
    const now = Date.now()
    for (let i = 0; i < this.tokens.length; i++) {
      const slot = this.tokens[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.tokens.length

      if (now >= slot.cooldownUntil) {
        return slot.token
      }
    }
    // Якщо всі на кулдауні, повертаємо перший
    return this.tokens[0].token
  }

  // Позначити поточний токен як перевантажений на 30 секунд
  markCurrentThrottled() {
    const prevIndex = (this.currentIndex - 1 + this.tokens.length) % this.tokens.length
    this.tokens[prevIndex].cooldownUntil = Date.now() + 30_000
    this.logger.warn(`Token at index ${prevIndex} placed on cooldown for 30s. Switching tokens...`)
  }
}
```

### 3.3. Простий HTTP-клієнт із повтором (`deezer-http.client.ts`)

```ts
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DeezerTokenManager } from './deezer-token.manager.js'

@Injectable()
export class DeezerHttpClient {
  private readonly baseUrl: string

  constructor(
    private readonly config: ConfigService,
    private readonly tokenManager: DeezerTokenManager,
  ) {
    this.baseUrl = this.config.get<string>('DEEZER_API_URL', 'https://api.deezer.com')
  }

  async get<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const token = this.tokenManager.getToken()
      const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`)

      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined) url.searchParams.set(key, String(val))
      }
      if (token) url.searchParams.set('access_token', token)

      try {
        const res = await fetch(url.toString())
        const data = await res.json()

        // Перевіряємо помилку квоти Deezer
        if (data?.error?.code === 4 || res.status === 429) {
          this.tokenManager.markCurrentThrottled()
          continue // ретраїмо з іншим токеном
        }

        if (data?.error) {
          throw new Error(data.error.message || 'Deezer API Error')
        }

        return data as T
      } catch (err: any) {
        if (attempt === maxRetries)
          throw new ServiceUnavailableException('Catalog is temporarily unavailable.')
      }
    }

    throw new ServiceUnavailableException('Deezer rate limit exceeded. Please try again shortly.')
  }
}
```

---

## 4. Зміни в базі даних (Prisma)

Ми **не зберігаємо весь каталог Deezer** у базу, бо там мільйони записів.
Але моделі `Artist`, `Album`, `Track`, `Genre` нам потрібні для того, щоб зберігати треки в базі, коли користувач:

- додає трек у свій плейлист;
- ставить лайк;
- або слухає трек (історія).

У файл `apps/api/prisma/schema.prisma` додаємо:

```prisma
model Artist {
  id         String        @id @default(uuid())
  provider   MusicProvider @default(DEEZER)
  providerId String        @map("provider_id")
  name       String
  images     Json?         @default("{}")
  createdAt  DateTime      @default(now()) @map("created_at")
  updatedAt  DateTime      @updatedAt @map("updated_at")

  tracks     Track[]
  albums     Album[]

  @@unique([provider, providerId])
  @@map("artists")
}

model Album {
  id          String        @id @default(uuid())
  provider    MusicProvider @default(DEEZER)
  providerId  String        @map("provider_id")
  title       String
  artistId    String        @map("artist_id")
  cover       Json?         @default("{}")
  releaseDate DateTime?     @map("release_date")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  artist      Artist        @relation(fields: [artistId], references: [id], onDelete: Cascade)
  tracks      Track[]

  @@unique([provider, providerId])
  @@map("albums")
}

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

  artist       Artist        @relation(fields: [artistId], references: [id], onDelete: Cascade)
  album        Album         @relation(fields: [albumId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@map("tracks")
}

model Genre {
  id         String        @id @default(uuid())
  provider   MusicProvider @default(DEEZER)
  providerId String        @map("provider_id")
  name       String
  images     Json?         @default("{}")
  createdAt  DateTime      @default(now()) @map("created_at")
  updatedAt  DateTime      @updatedAt @map("updated_at")

  @@unique([provider, providerId])
  @@map("genres")
}
```

### Команди для міграції:

```bash
pnpm --filter @music-app/api prisma:migrate:dev --name add_catalog_entities
pnpm --filter @music-app/api prisma:generate
```

---

## 5. Бекенд (`apps/api`)

### 5.1. Мапінг (`deezer.mapper.ts`)

Простий клас зі статичними функціями, який перетворює DTO від Deezer у наші канонічні типи `TrackSummary`, `AlbumSummary`, `ArtistSummary`:

- Картинки: об'єднує `cover_small`, `cover_medium`, `cover_big`, `cover_xl` в один об'єкт `ImageSet`.
- Пагінація: перетворює `data` та `total` у `{ items: [], pagination: { total, limit, offset, hasNext } }`.

### 5.2. Сервіс каталогу з кешуванням у Redis (`catalog.service.ts`)

Кешуємо результати через існуючий `CacheService`:

- Пошук: TTL 1 година (`catalog:search:{query}:{offset}`).
- Треки, альбоми, артисти: TTL 24 години (`catalog:track:{id}`).
- Чарти: TTL 2 години (`catalog:charts`).
- Жанри: TTL 7 днів (`catalog:genres`).

### 5.3. Ендпоінти контролера (`catalog.controller.ts`)

- `GET /api/catalog/search?q=...&limit=25&offset=0` — універсальний пошук.
- `GET /api/catalog/tracks/:id` — деталі треку за ID.
- `GET /api/catalog/albums/:id` — деталі альбому та його треки.
- `GET /api/catalog/artists/:id` — сторінка виконавця.
- `GET /api/catalog/artists/:id/top-tracks` — топ треки артиста.
- `GET /api/catalog/genres` — список жанрів.
- `GET /api/catalog/charts` — популярні треки та альбоми.

---

## 6. Спільні типи та клієнт (`packages/*`)

### 6.1. `packages/shared-types`

Експортуємо нові типи з файлу `catalog.ts`:
`TrackSummary`, `TrackDetails`, `AlbumSummary`, `AlbumDetails`, `ArtistSummary`, `ArtistDetails`, `Genre`, `SearchResult`.

### 6.2. `packages/api-client`

Додаємо метод `catalog` у виклики API клієнта:

```ts
catalog: {
  search: (params: { q: string; limit?: number; offset?: number }) =>
    http.get<SearchResult>('/catalog/search', { params }),
  getTrack: (id: string) =>
    http.get<TrackDetails>(`/catalog/tracks/${id}`),
  getAlbum: (id: string) =>
    http.get<AlbumDetails>(`/catalog/albums/${id}`),
  getArtist: (id: string) =>
    http.get<ArtistDetails>(`/catalog/artists/${id}`),
  getGenres: () =>
    http.get<Genre[]>('/catalog/genres'),
  getCharts: () =>
    http.get<SearchResult>('/catalog/charts'),
}
```

---

## 7. Простий план дій

1. **Крок 1 (БД):** додати моделі в `schema.prisma` і виконати команду міграції `prisma:migrate:dev`.
2. **Крок 2 (Спільні типи):** створити файл `packages/shared-types/src/catalog.ts`, експортувати його в `index.ts` та додати методи в `packages/api-client`.
3. **Крок 3 (Deezer клієнт і токени):**
   - Створити `deezer.types.ts` із DTO.
   - Створити `deezer-token.manager.ts` із пулом токенів та ротацією.
   - Створити `deezer-http.client.ts` із перевіркою помилки `code: 4` та повторною спробою.
   - Створити `deezer.mapper.ts` для перетворення у формат Sonora.
   - Зібрати це в `DeezerProvider`.
4. **Крок 4 (Модуль каталогу):** створити `CatalogService` з кешуванням у Redis та `CatalogController` з ендпоінтами.
5. **Крок 5 (Перевірка):** відкрити Swagger (`/api/docs`), зробити тестовий пошук і перевірити, що треки повертаються з прев'ю та картинками.
