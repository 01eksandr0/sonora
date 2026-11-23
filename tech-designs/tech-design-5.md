# Технічний дизайн: Задача 5 — Сторінка автора / виконавця (Artist Page)

**Гілка:** `tech-design-5`  
**Статус:** Готово до реалізації  
**Автор:** Джуніор розробник  
**Пов’язані розділи ROADMAP.md:** 4, 5, 18–20, 22, 26, 32–34, 38 (Phase 11)

---

## 1. Що потрібно зробити (мета задачі)

Зараз при кліку на виконавця в результатах пошуку (`/app/search`) або при прямому переході за посиланням `/app/artist/:id` відкривається лише заготовка (`ArtistPage.vue`) з текстом `<h1>Artist</h1>`.

Потрібно створити зрозумілу, надійну та візуально акуратну сторінку артиста без зайвого ускладнення (оверінжинірингу), на якій користувач побачить:

1. **Шапку артиста (Hero):** велике фото, ім'я, кількість фанів/слухачів, загальну кількість альбомів, візуальні кнопки дій.
2. **Популярні пісні (Popular):** список топ-треків виконавця (номер, обкладинка, назва, тривалість, назва альбому).
3. **Альбоми (Albums):** сітка альбомів артиста (обкладинка, назва альбому, рік випуску з переходом на сторінку альбому).

---

### Як це має працювати для користувача

1. Користувач переходить на сторінку артиста (наприклад, `/app/artist/119` для Metallica або клікає на картку артиста в пошуку).
2. Сторінка показує початковий індикатор завантаження (`<div class="spinner"></div>`), поки завантажуються базові дані артиста.
3. Як тільки дані артиста завантажено, користувач одразу бачить **Hero-секцію**:
   - Велике фото артиста (кругле).
   - Підпис `ARTIST`.
   - Велике ім'я артиста (наприклад, `Metallica`).
   - Метадані: кількість слухачів (`artist.fansCount`, наприклад `8.5M fans`) та загальна кількість альбомів (`artist.albumsCount` альбомів за даними каталогу).
   - Кнопку `Play` (акцентна кругла кнопка, неактивна з атрибутом `disabled` до реалізації плеєра у Phase 12).
   - Кнопку `Follow` (контурна кнопка-плейсхолдер з атрибутом `disabled` та підказкою `title="Library coming soon"` до реалізації бібліотеки у Phase 8).
4. **Секція «Popular» (Популярні треки):**
   - Завантажується незалежно від альбомів.
   - Відображає топ-5 популярних пісень за замовчуванням за допомогою вже існуючого компонента `TrackRow`.
   - Якщо треків більше 5 — є кнопка «Show more» / «Show less», яка розгортає список до 10 треків.
   - Якщо пісень немає — показується зрозумілий напис «No popular tracks found».
   - Якщо сталася помилка завантаження треків — показується блок помилки тільки для цієї секції з кнопкою «Try again».
5. **Секція «Albums» (Альбоми / Дискографія):**
   - Завантажується незалежно від треків.
   - Відображає адаптивну сітку альбомів (до 25 штук) за допомогою вже існуючого компонента `AlbumCard`.
   - Картка альбому показує обкладинку, назву, рік релізу та веде на `/app/album/:id` за `providerId`.
   - Якщо альбомів немає — показується напис «No albums found for this artist».
   - Якщо сталася помилка завантаження альбомів — показується блок помилки тільки для секції альбомів з кнопкою «Try again».
6. **Обробка помилок на рівні сторінки:**
   - **404 (Артиста не знайдено):** Якщо бекенд повернув статус 404 (артист не існує в каталозі Deezer), показується інформативний екран «Artist not found» із кнопкою повернення до пошуку («Go to Search»), без марної кнопки повтору запиту.
   - **Мережеві або серверні збої (500 тощо):** Показується повідомлення «Couldn't load artist details» з кнопкою повтору «Try again».

---

### Що входить до задачі (Scope)

- **Бекенд (`apps/api`):**
  - Оновлення інтерфейсу `MusicProvider`: додавання методу `getArtistAlbums`.
  - Реалізація `getArtistAlbums` у `DeezerProvider` через Deezer endpoint `/artist/{id}/albums` з перетворенням через `DeezerMapper.toAlbumSummary()`.
  - Кешування списку альбомів у Redis у `CatalogService` (TTL 24 години, ключ `catalog:artist:${id}:albums:${limit}:${offset}`).
  - Ендпоінт `GET /api/catalog/artists/:id/albums` у `CatalogController` з валідацією параметрів через існуючий `PaginationQueryDto`.
- **Спільні пакети (`packages/*`):**
  - Додавання виклику `getArtistAlbums` у `packages/api-client`.
  - Перевикористання існуючого спільного типу `Paginated<AlbumSummary>`.
  - Збірка клієнта: `pnpm --filter @music-app/api-client build`.
- **Фронтенд (`apps/web`):**
  - Розширення `queryKeys.catalog` у `apps/web/src/shared/api/query-keys.ts` ключами `artist`, `artistTopTracks(id, limit, offset)`, `artistAlbums(id, limit, offset)`.
  - Створення хуків TanStack Query у `apps/web/src/features/catalog/model/use-artist.query.ts`.
  - Оновлення сторінки `ArtistPage.vue` з ізольованими станами завантаження, роздільною обробкою 404 та помилок мережі, а також порожніх результатів для кожної секції.
  - Повне повторне використання існуючих компонентів `TrackRow` та `AlbumCard`.

---

### Що НЕ входить до задачі (Non-Goals)

- Повноцінний музичний плеєр і програвання аудіо (відтворюватиметься у Phase 12). Кнопка `Play` залишається візуальною (`disabled`) без фейкової симуляції.
- Збереження артиста у вибране / підписка (Phase 8 Library). Кнопка `Follow` залишається візуальним плейсхолдером (`disabled`).
- Складна багаторівнева дискографія (вкладки Singles, EPs, Compilations) — відображаємо релізи єдиним списком.
- Нескінченна пагінація зі скролом для сотень альбомів — для першої версії показуємо до 25 альбомів.

---

## 2. Зміни в базі даних (Database / Prisma)

**Змін у PostgreSQL немає.**

Дані про артистів, треки та альбоми є публічним каталогом і надходять із зовнішнього провайдера (Deezer) через наш бекенд з кешуванням у Redis. Жодних нових таблиць, полів чи міграцій додавати не потрібно.

---

## 3. Бекенд реалізація (`apps/api`)

### 3.1. Перевірка існуючого коду та реалізацій `MusicProvider`

- **Інші реалізації `MusicProvider`:** Перевірено кодову базу. Єдиною діючою реалізацією `MusicProvider` є `DeezerProvider` (`apps/api/src/infrastructure/providers/deezer/deezer.provider.ts`). Окремих mock-провайдерів чи тестових класів у репозиторії немає. Тому додавання методу `getArtistAlbums` в інтерфейс потребує реалізації лише в `DeezerProvider`.
- **Deezer DTO:** Інтерфейс `DeezerAlbumDto` вже описаний у `apps/api/src/infrastructure/providers/deezer/deezer.types.ts`:
  ```ts
  export interface DeezerAlbumDto extends DeezerImageDto {
    id: number
    title: string
    release_date?: string
    record_type?: string
    nb_tracks?: number
    duration?: number
    explicit_lyrics?: boolean
    artist?: { id: number; name: string }
    tracks?: DeezerPaginatedResponse<DeezerTrackDto>
  }
  ```
- **Мапінг `release_date`:** `DeezerMapper.toAlbumSummary()` уже коректно перетворює дату:
  `releaseDate: dto.release_date || null`.
- **Пагінація `DeezerMapper.toPaginated()`:** Метод приймає відповідь `DeezerPaginatedResponse<DeezerAlbumDto>`, розраховує `total`, `limit`, `offset`, `hasNext` і повертає `Paginated<AlbumSummary>`. Нових DTO чи маперів створювати не потрібно!

---

### 3.2. Інтерфейс `MusicProvider` (`src/infrastructure/providers/music-provider.interface.ts`)

Додаємо метод:

```ts
export interface MusicProvider {
  search(query: string, limit?: number, offset?: number): Promise<SearchResult>
  getTrack(id: string): Promise<TrackDetails>
  getAlbum(id: string): Promise<AlbumDetails>
  getArtist(id: string): Promise<ArtistDetails>
  getGenres(): Promise<Genre[]>
  getCharts(): Promise<ChartResult>
  getArtistTopTracks(id: string, limit?: number, offset?: number): Promise<Paginated<TrackSummary>>
  getArtistAlbums(id: string, limit?: number, offset?: number): Promise<Paginated<AlbumSummary>>
}
```

---

### 3.3. Реалізація в `DeezerProvider` (`src/infrastructure/providers/deezer/deezer.provider.ts`)

```ts
async getArtistAlbums(
  id: string,
  limit = 25,
  offset = 0,
): Promise<Paginated<AlbumSummary>> {
  const response = await this.http.get<DeezerPaginatedResponse<DeezerAlbumDto>>(
    `/artist/${encodeURIComponent(id)}/albums`,
    {
      limit,
      index: offset,
    },
  )

  return DeezerMapper.toPaginated(response, limit, offset, (item) =>
    DeezerMapper.toAlbumSummary(item),
  )
}
```

---

### 3.4. Кешування в `CatalogService` (`src/modules/catalog/catalog.service.ts`)

Дотримуємося існуючого стилю сервісу (як у `getArtist` та `getArtistTopTracks`):

- Префікс ключа: `catalog:artist:${id}:albums:${limit}:${offset}`
- TTL: `86400` секунд (24 години)
- Використання `this.cache.getOrSet(...)`

```ts
async getArtistAlbums(
  id: string,
  limit = 25,
  offset = 0,
): Promise<Paginated<AlbumSummary>> {
  const cacheKey = `catalog:artist:${id}:albums:${limit}:${offset}`

  return this.cache.getOrSet(
    cacheKey,
    86400,
    () => this.provider.getArtistAlbums(id, limit, offset),
  )
}
```

---

### 3.5. Валідація та контролер `CatalogController` (`src/modules/catalog/catalog.controller.ts`)

Використовуємо **вже існуючий `PaginationQueryDto`** (`src/modules/catalog/dto/pagination-query.dto.ts`):

- `limit`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, `@Max(100)`, дефолт 25.
- `offset`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)`, дефолт 0.

У контролері оформлюємо ендпоінт зі Swagger-декораторами в єдиному стилі:

```ts
@Get('artists/:id/albums')
@ApiOperation({ summary: 'Get artist albums' })
@ApiParam({ name: 'id', description: 'Deezer artist ID' })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'offset', required: false, type: Number })
async getArtistAlbums(
  @Param('id') id: string,
  @Query() query: PaginationQueryDto,
) {
  return this.catalogService.getArtistAlbums(
    id,
    query.limit,
    query.offset,
  )
}
```

Глобальний `ValidationPipe` з `whitelist: true` та `transform: true` автоматично валідує запит і відхиляє некоректні значення з кодом `400 Bad Request`.

---

## 4. Спільні пакети (`packages/*`)

1. **`packages/shared-types`:**
   Типи вже існують (`ArtistDetails`, `TrackSummary`, `AlbumSummary`, `Paginated`). Жодних нових типів чи дублювань типу `ArtistAlbumResponse` створювати не потрібно — повертається стандартний `Paginated<AlbumSummary>`.

2. **`packages/api-client` (`packages/api-client/src/client.ts`):**
   Додаємо метод у простір імен `catalog`:
   ```ts
   getArtistAlbums: (id: string, params?: { limit?: number; offset?: number }) =>
     http.get<Paginated<AlbumSummary>>(`/catalog/artists/${encodeURIComponent(id)}/albums`, {
       query: params,
     }),
   ```
   **Обов'язкова збірка:**
   ```bash
   pnpm --filter @music-app/api-client build
   ```

---

## 5. Фронтенд реалізація (`apps/web`)

### 5.1. Розширення структури `features/catalog`

У Task 4 пошук каталогу було винесено в `apps/web/src/features/catalog/model/`.
Ми розширюємо цю саму структуру та додаємо хуки для сторінки артиста поруч:
`apps/web/src/features/catalog/model/use-artist.query.ts`.

---

### 5.2. Ключі кешу (`shared/api/query-keys.ts`)

Враховуємо і `limit`, і `offset`, щоб у майбутньому при пагінації ключі кешу не конфліктували:

```ts
export const queryKeys = {
  health: ['health'] as const,
  currentUser: ['current-user'] as const,
  catalog: {
    search: (query: string, limit: number, offset: number) =>
      ['catalog', 'search', query, limit, offset] as const,
    artist: (id: string) => ['catalog', 'artist', id] as const,
    artistTopTracks: (id: string, limit: number, offset: number) =>
      ['catalog', 'artist', id, 'top-tracks', limit, offset] as const,
    artistAlbums: (id: string, limit: number, offset: number) =>
      ['catalog', 'artist', id, 'albums', limit, offset] as const,
  },
  recommendations: {
    collection: ['recommendations', 'collection'] as const,
  },
} as const
```

---

### 5.3. Запити TanStack Query (`features/catalog/model/use-artist.query.ts`)

```ts
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

export function useArtistDetails(artistId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.catalog.artist(toValue(artistId))),
    queryFn: () => api.catalog.getArtist(toValue(artistId)),
    enabled: computed(() => Boolean(toValue(artistId))),
  })
}

export function useArtistTopTracks(artistId: MaybeRefOrGetter<string>, limit = 10, offset = 0) {
  return useQuery({
    queryKey: computed(() => queryKeys.catalog.artistTopTracks(toValue(artistId), limit, offset)),
    queryFn: () => api.catalog.getArtistTopTracks(toValue(artistId), { limit, offset }),
    enabled: computed(() => Boolean(toValue(artistId))),
  })
}

export function useArtistAlbums(artistId: MaybeRefOrGetter<string>, limit = 25, offset = 0) {
  return useQuery({
    queryKey: computed(() => queryKeys.catalog.artistAlbums(toValue(artistId), limit, offset)),
    queryFn: () => api.catalog.getArtistAlbums(toValue(artistId), { limit, offset }),
    enabled: computed(() => Boolean(toValue(artistId))),
  })
}
```

---

### 5.4. Перевірка компонентів `TrackRow` та `AlbumCard`

- **`TrackRow.vue` (`apps/web/src/entities/track/ui/TrackRow.vue`):**
  - Приймає пропси: `track: TrackSummary` та опціональний `index?: number`.
  - Відображає: номер треку (`index + 1`), обкладинку альбому (`track.album.cover.small`), назву треку, виконавця, назву альбому (`track.album.title`) та тривалість у форматі `х:хх`.
  - Повністю підходить для секції «Popular».
- **`AlbumCard.vue` (`apps/web/src/entities/album/ui/AlbumCard.vue`):**
  - Приймає пропс: `album: AlbumSummary`.
  - Переходить за `providerId` на маршрут `{ name: 'album', params: { id: album.providerId } }`.
  - Форматує дату на фронтенді: `releaseDate ? releaseDate.slice(0, 4) : null`, якщо дати немає — коректно приховує рік.
  - Повністю підходить для секції «Albums».

---

### 5.5. Архітектура та логіка сторінки `ArtistPage.vue`

Файл: `apps/web/src/pages/app/artist/ui/ArtistPage.vue`

#### Стан завантаження та роздільна обробка помилок:

| Секція             | Стан завантаження                                  | Стан помилки                                                                                                                          | Порожній стан                     |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Artist Hero**    | Блокує відображення сторінки («Loading artist...») | • **404:** «Artist not found» з кнопкою переходу на пошук.<br>• **Мережевий збій:** «Couldn't load artist details» з кнопкою `Retry`. | Артиста не знайдено (404)         |
| **Popular Tracks** | Скелетон/індикатор списку пісень                   | Помилка тільки блоку пісень («Failed to load popular tracks») з кнопкою `Retry`                                                       | «No popular tracks found»         |
| **Albums Grid**    | Скелетон/індикатор сітки альбомів                  | Помилка тільки блоку альбомів («Failed to load albums») з кнопкою `Retry`                                                             | «No albums found for this artist» |

#### Кнопки дій:

- **`Play`:** Візуальна кругла акцентна кнопка з іконкою відтворення. Оскільки плеєр ще не реалізовано (Phase 12), кнопка має атрибут `disabled` (з підказкою `title="Player coming soon"`), щоб не створювати фіктивної функціональності.
- **`Follow`:** Контурна кнопка з текстом «Follow». Має атрибут `disabled` (з підказкою `title="Library coming soon"` до Phase 8) та відповідний стиль `:disabled`, щоб користувач чітко розумів, що це плейсхолдер.

#### Індикатор завантаження:

- Використовує коректний HTML-елемент `<div class="spinner"></div>` зі стилями CSS-анімації обертання.

#### Кількість альбомів:

- У Hero виводиться **загальна кількість з каталогу**: `artist.albumsCount` (наприклад, `42 albums`).
- У сітці виводяться **завантажені альбоми**: `albums.length` (до 25). Ми не підміняємо одне значення іншим!

#### Код компонента `ArtistPage.vue`:

```html
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { RouterLink, useRoute } from 'vue-router'
  import { ApiError } from '@music-app/api-client'
  import {
    IconPlayerPlayFilled,
    IconAlertCircle,
    IconUser,
    IconMusic,
    IconDisc,
  } from '@tabler/icons-vue'
  import {
    useArtistDetails,
    useArtistTopTracks,
    useArtistAlbums,
  } from '@/features/catalog/model/use-artist.query'
  import { TrackRow } from '@/entities/track'
  import { AlbumCard } from '@/entities/album'

  const route = useRoute()
  const artistId = computed(() => String(route.params.id || ''))

  // 1. Деталі артиста
  const {
    data: artist,
    isPending: isArtistPending,
    isError: isArtistError,
    error: artistError,
    refetch: refetchArtist,
  } = useArtistDetails(artistId)

  // 2. Популярні треки (завантажуємо 10)
  const {
    data: topTracksData,
    isPending: isTracksPending,
    isError: isTracksError,
    refetch: refetchTracks,
  } = useArtistTopTracks(artistId, 10, 0)

  // 3. Альбоми (завантажуємо до 25)
  const {
    data: albumsData,
    isPending: isAlbumsPending,
    isError: isAlbumsError,
    refetch: refetchAlbums,
  } = useArtistAlbums(artistId, 25, 0)

  // Перевірка 404 помилки (артиста не знайдено)
  const isNotFound = computed(() => {
    return artistError.value instanceof ApiError && artistError.value.status === 404
  })

  // Перемикач відображення: 5 чи 10 треків
  const isExpandedTracks = ref(false)

  const allTracks = computed(() => topTracksData.value?.items ?? [])
  const visibleTracks = computed(() =>
    isExpandedTracks.value ? allTracks.value : allTracks.value.slice(0, 5),
  )
  const albums = computed(() => albumsData.value?.items ?? [])

  function formatFansCount(count: number | null | undefined): string {
    if (!count) return ''
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M fans`
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(0)}K fans`
    }
    return `${count} fans`
  }
</script>

<template>
  <div class="artist-page">
    <!-- Початкове завантаження артиста -->
    <div v-if="isArtistPending" class="state-container">
      <div class="spinner"></div>
      <p>Loading artist...</p>
    </div>

    <!-- Артиста не знайдено (404) -->
    <div v-else-if="isNotFound" class="state-container not-found-state" role="alert">
      <IconAlertCircle :size="36" />
      <h2>Artist not found</h2>
      <p>The artist you are looking for doesn't exist or has been removed.</p>
      <RouterLink :to="{ name: 'search' }" class="btn-retry"> Go to Search </RouterLink>
    </div>

    <!-- Загальна помилка завантаження артиста (збій мережі або сервера) -->
    <div v-else-if="isArtistError || !artist" class="state-container error-state" role="alert">
      <IconAlertCircle :size="36" />
      <h2>Couldn't load artist details</h2>
      <p>Please check your connection and try again.</p>
      <button type="button" class="btn-retry" @click="refetchArtist()">Try again</button>
    </div>

    <!-- Основний контент -->
    <template v-else>
      <!-- Hero-секція -->
      <section class="artist-hero">
        <img
          v-if="artist.images.large || artist.images.medium"
          :src="artist.images.large || artist.images.medium || ''"
          :alt="artist.name"
          class="artist-avatar"
        />
        <div v-else class="artist-avatar-empty">
          <IconUser :size="64" />
        </div>

        <div class="artist-info">
          <span class="eyebrow accent-text">ARTIST</span>
          <h1 class="artist-name">{{ artist.name }}</h1>
          <div class="artist-meta">
            <span v-if="artist.fansCount">{{ formatFansCount(artist.fansCount) }}</span>
            <span v-if="artist.fansCount && artist.albumsCount !== null"> • </span>
            <span v-if="artist.albumsCount !== null">{{ artist.albumsCount }} albums</span>
          </div>

          <div class="artist-actions">
            <button
              class="play-btn is-disabled"
              type="button"
              title="Player coming soon"
              aria-label="Play artist"
              disabled
            >
              <IconPlayerPlayFilled :size="20" />
            </button>
            <button class="follow-btn" type="button" title="Library coming soon" disabled>
              Follow
            </button>
          </div>
        </div>
      </section>

      <!-- Секція «Popular» -->
      <section class="section-block">
        <h2 class="section-title">Popular</h2>

        <div v-if="isTracksPending" class="section-loading">
          <p>Loading top tracks...</p>
        </div>

        <div v-else-if="isTracksError" class="section-error">
          <p>Failed to load popular tracks.</p>
          <button type="button" class="btn-retry-inline" @click="refetchTracks()">Try again</button>
        </div>

        <div v-else-if="!allTracks.length" class="section-empty">
          <IconMusic :size="20" />
          <p>No popular tracks found</p>
        </div>

        <div v-else class="popular-tracks-list">
          <TrackRow
            v-for="(track, index) in visibleTracks"
            :key="track.providerId"
            :track="track"
            :index="index"
          />

          <button
            v-if="allTracks.length > 5"
            type="button"
            class="toggle-tracks-btn"
            @click="isExpandedTracks = !isExpandedTracks"
          >
            {{ isExpandedTracks ? 'Show less' : 'Show more' }}
          </button>
        </div>
      </section>

      <!-- Секція «Albums» -->
      <section class="section-block">
        <h2 class="section-title">Albums</h2>

        <div v-if="isAlbumsPending" class="section-loading">
          <p>Loading albums...</p>
        </div>

        <div v-else-if="isAlbumsError" class="section-error">
          <p>Failed to load albums.</p>
          <button type="button" class="btn-retry-inline" @click="refetchAlbums()">Try again</button>
        </div>

        <div v-else-if="!albums.length" class="section-empty">
          <IconDisc :size="20" />
          <p>No albums found for this artist</p>
        </div>

        <div v-else class="albums-grid">
          <AlbumCard v-for="album in albums" :key="album.providerId" :album="album" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
  .artist-page {
    display: flex;
    flex-direction: column;
    gap: 36px;
    padding-bottom: 60px;
  }

  .artist-hero {
    align-items: flex-end;
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    padding: 16px 0 24px;
  }

  .artist-avatar,
  .artist-avatar-empty {
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    height: 180px;
    object-fit: cover;
    width: 180px;
  }

  .artist-avatar-empty {
    align-items: center;
    background: var(--sonora-card);
    color: var(--sonora-muted);
    display: flex;
    justify-content: center;
  }

  .artist-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .artist-name {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    line-height: 1.1;
    margin: 0;
  }

  .artist-meta {
    color: var(--sonora-muted);
    font-size: 14px;
  }

  .artist-actions {
    align-items: center;
    display: flex;
    gap: 16px;
    margin-top: 10px;
  }

  .play-btn {
    align-items: center;
    background: var(--sonora-accent);
    border: none;
    border-radius: 50%;
    color: #000;
    cursor: pointer;
    display: flex;
    height: 48px;
    justify-content: center;
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
    width: 48px;
  }

  .play-btn.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .follow-btn {
    background: transparent;
    border: 1px solid var(--sonora-border, rgba(255, 255, 255, 0.2));
    border-radius: 20px;
    color: var(--sonora-text);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 20px;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .follow-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .follow-btn:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--sonora-text);
  }

  .section-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
  }

  .popular-tracks-list {
    display: flex;
    flex-direction: column;
  }

  .toggle-tracks-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--sonora-muted);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    margin-top: 12px;
    padding: 6px 10px;
    transition: color 0.15s ease;
  }

  .toggle-tracks-btn:hover {
    color: var(--sonora-text);
  }

  .albums-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .state-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 72px 0;
    text-align: center;
  }

  .spinner {
    animation: spin 0.8s linear infinite;
    border: 3px solid var(--sonora-card);
    border-radius: 50%;
    border-top-color: var(--sonora-accent);
    height: 32px;
    width: 32px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .section-loading,
  .section-error,
  .section-empty {
    align-items: center;
    color: var(--sonora-muted);
    display: flex;
    gap: 10px;
    padding: 24px 0;
  }

  .btn-retry,
  .btn-retry-inline {
    background: var(--sonora-card);
    border: 1px solid var(--sonora-border, rgba(255, 255, 255, 0.2));
    border-radius: 8px;
    color: var(--sonora-text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .btn-retry:hover,
  .btn-retry-inline:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
```

---

## 6. Рекомендований порядок реалізації (Implementation Plan)

### Крок 1. Backend — Albums endpoint

- [ ] Оновити `apps/api/src/infrastructure/providers/music-provider.interface.ts`: додати метод `getArtistAlbums`.
- [ ] Оновити `apps/api/src/infrastructure/providers/deezer/deezer.provider.ts`: реалізувати `getArtistAlbums` з викликом `/artist/{id}/albums` та мапінгом через `DeezerMapper.toAlbumSummary`.
- [ ] Оновити `apps/api/src/modules/catalog/catalog.service.ts`: додати `getArtistAlbums` з кешуванням у Redis (TTL 24h = 86400 с, ключ `catalog:artist:${id}:albums:${limit}:${offset}`).
- [ ] Оновити `apps/api/src/modules/catalog/catalog.controller.ts`: додати ендпоінт `@Get('artists/:id/albums')` з використанням існуючого `PaginationQueryDto`.
- [ ] Перевірити роботу в Swagger (`http://localhost:3000/api/docs`).

### Крок 2. API Client

- [ ] Додати метод `getArtistAlbums(id, params)` у `packages/api-client/src/client.ts`.
- [ ] Перевірити сумісність типів (`Paginated<AlbumSummary>`).
- [ ] Виконати збірку: `pnpm --filter @music-app/api-client build`.

### Крок 3. Frontend — Query layer

- [ ] Оновити `apps/web/src/shared/api/query-keys.ts`: додати `artist`, `artistTopTracks(id, limit, offset)`, `artistAlbums(id, limit, offset)`.
- [ ] Створити `apps/web/src/features/catalog/model/use-artist.query.ts` з хуками `useArtistDetails`, `useArtistTopTracks`, `useArtistAlbums`.

### Крок 4. Frontend — ArtistPage

- [ ] Оновити `apps/web/src/pages/app/artist/ui/ArtistPage.vue`:
  - Hero-секція з фото, іменем, фанами та загальною кількістю альбомів.
  - Кнопки дій: Play (`disabled`) та Follow (`disabled` з відповідними стилями).
  - Секція «Popular» з використанням `TrackRow` та кнопкою «Show more» (перемикання 5 / 10 треків).
  - Секція «Albums» з використанням `AlbumCard` у сітці (до 25 альбомів).
  - Незалежні стани завантаження з `<div class="spinner"></div>`.
  - Окрема обробка помилки 404 («Artist not found» з лінком на пошук) та збоїв мережі (з кнопкою «Try again»).
  - Адаптивна стилізація з дизайн-токенами Sonora.

### Крок 5. Перевірка та верифікація

- [ ] Перевірити відкриття артиста за ID (наприклад, `/app/artist/119` для Metallica).
- [ ] Перевірити перехід зі сторінки пошуку (`/app/search`) при кліку на артиста.
- [ ] Перевірити роботу перемикача «Show more» / «Show less» у популярних треках.
- [ ] Перевірити клік на картку альбому та перехід на `/app/album/:id`.
- [ ] Перевірити відкриття неіснуючого артиста (наприклад, `/app/artist/99999999999`) та відображення екрану 404 «Artist not found».
- [ ] Перевірити поведінку при збої мережі (відображення кнопок «Try again» для окремих секцій).
- [ ] Перевірити збірку та лінтинг: `pnpm lint`, `pnpm build`, `pnpm typecheck`.

---

## 7. Зведена таблиця архітектурних рішень

| Пункт                          | Рішення                                           | Обґрунтування                                                                                                      |
| ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Backend endpoint**           | `GET /api/catalog/artists/:id/albums`             | Необхідний для отримання дискографії артиста з Deezer API.                                                         |
| **Реалізації `MusicProvider`** | Лише `DeezerProvider`                             | Перевірено код: немає моків чи сторонніх провайдерів, ламати нічого.                                               |
| **Deezer DTO & Mapper**        | `DeezerAlbumDto`, `toAlbumSummary`, `toPaginated` | Уже існують у проєкті, підтримують `release_date`, нових DTO не створюємо.                                         |
| **Redis TTL**                  | `86400` с (24 години)                             | Відповідає стилю кешування деталей каталогу в `CatalogService`.                                                    |
| **Валідація limit/offset**     | `PaginationQueryDto`                              | Існуючий DTO: `limit` (1..100, дефолт 25), `offset` (>=0, дефолт 0).                                               |
| **Shared Types**               | `Paginated<AlbumSummary>`                         | Використовуємо існуючий канонічний контракт без дублювання.                                                        |
| **API Client**                 | `getArtistAlbums`                                 | Єдина точка звернення для вебу, збірка через `pnpm build`.                                                         |
| **Структура запитів**          | Три незалежні Query                               | Hero, треки та альбоми вантажаться незалежно.                                                                      |
| **Query Keys**                 | Включають і `limit`, і `offset`                   | Запобігає колізіям кешу при подальшому додаванні пагінації.                                                        |
| **Обробка помилок**            | Роздільна по секціях                              | Помилка в альбомах не ламає відображення Hero та треків.                                                           |
| **Обробка 404**                | Окремий стан «Artist not found»                   | При `ApiError.status === 404` показуємо інформативний 404-екран з переходом до пошуку замість нескінченного Retry. |
| **Стани Loading**              | Незалежні для секцій                              | Hero показується одразу після приходу даних артиста.                                                               |
| **Індикатор завантаження**     | `<div class="spinner"></div>`                     | Коректний HTML5 тег зі стилями анімації обертання.                                                                 |
| **Компоненти**                 | `TrackRow` та `AlbumCard`                         | Пропси перевірено, повністю сумісні з вимогами сторінки артиста.                                                   |
| **Кнопка Play**                | Візуальна (`disabled`)                            | Плеєр розробляється окремо (Phase 12), жодних фейкових таймерів.                                                   |
| **Кнопка Follow**              | Плейсхолдер (`disabled`)                          | Явно неактивна кнопка (`disabled` + стилі `:disabled`) без фейкової функціональності до Phase 8.                   |
| **Кількість альбомів**         | `albumsCount` vs `items.length`                   | У Hero виводиться загальна кількість із каталогу, в сітці — до 25 завантажених.                                    |

---

## 8. Критерії готовності (Definition of Done)

- [ ] Сторінка `/app/artist/:id` відображає дані артиста за його `providerId`.
- [ ] У Hero відображається аватар (або заглушка), ім'я, форматована кількість фанів і загальна кількість альбомів.
- [ ] Кнопка `Play` має стан `disabled`, а `Follow` — `disabled` з відповідним стилем плейсхолдера.
- [ ] Індикатор завантаження коректно рендериться як `<div class="spinner"></div>` з анімацією.
- [ ] Окремо та коректно обробляється помилка 404 («Artist not found» з посиланням на пошук) та збої мережі (з кнопкою повтору).
- [ ] Секція «Popular» показує топ-треки через `TrackRow` з номером, обкладинкою, тривалістю та альбомом.
- [ ] Працює розгортання треків з 5 до 10 за допомогою кнопки «Show more».
- [ ] Секція «Albums» відображає сітку завантажених альбомів артиста через `AlbumCard`.
- [ ] Клік на картку альбому переходить на маршрут `/app/album/:id` за `providerId`.
- [ ] Помилка одного із запитів (треки або альбоми) не приховує всю сторінку, а показує локальне повідомлення та кнопку повтору.
- [ ] Ендпоінт `GET /api/catalog/artists/:id/albums` працює, валідується через `PaginationQueryDto` та кешується в Redis.
- [ ] `pnpm build`, `pnpm lint` та `pnpm typecheck` проходять успішно без помилок.
