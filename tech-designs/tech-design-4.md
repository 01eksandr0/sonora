# Технічний дизайн: Задача 4 — Сторінка пошуку

**Гілка:** `tech-design-4`  
**Статус:** Чернетка для реалізації  
**Автор:** Джуніор розробник  
**Пов’язані розділи ROADMAP.md:** 4, 30, 32–34, 38 (Phase 11)

---

## 1. Що потрібно зробити (мета задачі)

Зараз сторінка пошуку (`/app/search`) — це просто заготовка: вона показує поле введення та рядок «Found X tracks», але самі результати не відображаються.

Потрібно зробити повноцінну, просту і зручну сторінку пошуку, на якій користувач може знайти пісні, артистів та альбоми.

### Як це має працювати для користувача

1. Користувач відкриває `/app/search` або переходить туди через кнопку пошуку в сайдбарі/хедері.
2. Вводить запит у поле пошуку (наприклад, `Deftones` або `Starboy`).
3. Поки користувач друкує, ми чекаємо 300 мс після останнього натискання клавіші (debounce), щоб не спамити бекенд зайвими запитами.
4. Пошук спрацьовує, якщо введено **хоча б 2 символи**.
5. Результати автоматично з'являються на екрані та згруповані за категоріями:
   - **Треки** (назва, виконавець, альбом, обкладинка, тривалість).
   - **Артисти** (фото, ім'я, перехід на сторінку артиста).
   - **Альбоми** (обкладинка, назва, виконавець, рік, перехід на сторінку альбому).
6. Зверху є таби-фільтри: **«Всі» (All)**, **«Треки» (Tracks)**, **«Артисти» (Artists)**, **«Альбоми» (Albums)**, щоб користувач міг швидко відфільтрувати потрібне.
7. Пошуковий запит зберігається в URL як query-параметр: `/app/search?q=queen`. Якщо користувач оновив сторінку або перейшов за посиланням — пошук відновлюється автоматично.
8. У полі вводу є кнопка швидкого очищення (іконка хрестика `X`), якщо текст введено.

### Що входить до задачі (Scope)

- Оновлення сторінки `SearchPage.vue` (`apps/web/src/pages/app/search/`).
- Віджет/секція відображення результатів `SearchResults.vue` (`apps/web/src/widgets/search-results/`).
- Компоненти відображення:
  - Рядок треку (номер, обкладинка, назва, виконавець, назва альбому, тривалість у форматі `х:хх`).
  - Картка артиста (кругле фото, ім'я, посилання на `/app/artist/:id`).
  - Картка альбому (квадратна обкладинка, назва альбому, виконавець, посилання на `/app/album/:id`).
- Дебаунс введення запиту (300 мс через `@vueuse/core`).
- Синхронізація з URL (`route.query.q`).
- Таби фільтрації: `all`, `tracks`, `artists`, `albums`.
- Всі візуальні стани:
  - **Початковий стан (Empty query)**: підказка «What do you want to listen to? Try searching for an artist, album, or track».
  - **Завантаження (Loading)**: приємний стан завантаження під час пошуку.
  - **Помилка (Error)**: повідомлення про збій із кнопкою «Try again».
  - **Порожній результат (No results)**: якщо нічого не знайдено — «No results found for "{query}"».

### Що НЕ входить до задачі (Non-Goals)

- Повноцінний музичний плеєр (відтворення черги, перемотування — це Phase 12).
- Збереження історії пошуку користувача в базу даних (це Phase 9).
- Пошук користувацьких плейлистів (шукаємо тільки треки/альбоми/артисти в каталозі Deezer).
- Складна нескінченна пагінація зі скролом (поки показуємо до 25 результатів на категорію, як повертає поточне API).

---

## 2. Зміни в базі даних (Database / Prisma)

**Змін у базі даних немає.**

Пошук не зберігає стан у PostgreSQL. Усі запити виконуються в реальному часі через зовнішній каталог Deezer з кешуванням у Redis. Жодних нових моделей або міграцій додавати не потрібно.

---

## 3. Бекенд (`apps/api`)

Бекенд уже має готовий ендпоінт у модулі каталогу:

`GET /api/catalog/search?q={query}&limit={limit}&offset={offset}`

Файл: `apps/api/src/modules/catalog/catalog.controller.ts`

### Як він працює:

1. Контролер приймає query-параметри через `SearchQueryDto`:
   - `q`: текст запиту (обов'язковий, не порожній).
   - `limit`: кількість записів (за замовчуванням 25, максимум 100).
   - `offset`: зсув для пагінації (за замовчуванням 0).
2. Сервіс `CatalogService`:
   - Нормалізує запит: `trim().toLowerCase()`.
   - Перевіряє кеш Redis за ключем: `catalog:search:${normalizedQuery}:${limit}:${offset}` (TTL: 3600 секунд / 1 година).
   - Якщо в кеші немає — звертається до `MusicProvider.search()` (Deezer).
3. Повертає типізовану відповідь `SearchResult`:
   ```ts
   {
     tracks: { items: TrackSummary[], pagination: { total, limit, offset, hasNext } },
     albums: { items: AlbumSummary[], pagination: { total, limit, offset, hasNext } },
     artists: { items: ArtistSummary[], pagination: { total, limit, offset, hasNext } }
   }
   ```

> [!NOTE]
> З боку бекенду нічого змінювати або дописувати не потрібно. Ендпоінт повністю готовий до роботи.

---

## 4. Спільні пакети (`packages/*`)

Тут також уже все підготовлено:

1. **`packages/shared-types`**:
   - `SearchResult`, `TrackSummary`, `AlbumSummary`, `ArtistSummary`, `Paginated<T>` — усі типи вже оголошені в `src/catalog.ts`.
2. **`packages/api-client`**:
   - Метод `api.catalog.search({ q, limit, offset })` уже є в `src/client.ts`.

Нічого додавати чи змінювати в спільних пакетах не потрібно.

---

## 5. Фронтенд (`apps/web`)

Уся робота за цією задачею виконується на фронтенді згідно з архітектурою Feature-Sliced Design (FSD).

### 5.1. FSD структура компонентів

```text
apps/web/src/
├── entities/
│   ├── track/ui/TrackRow.vue         # Рядок треку (обкладинка, назва, виконавець, тривалість)
│   ├── artist/ui/ArtistCard.vue      # Картка артиста (кругле фото, ім'я)
│   └── album/ui/AlbumCard.vue        # Картка альбому (обкладинка, назва, виконавець, рік)
├── widgets/
│   └── search-results/
│       ├── index.ts
│       └── ui/SearchResults.vue      # Віджет секцій/результатів пошуку з табами
├── features/
│   └── catalog/model/use-catalog-search.query.ts # Хук TanStack Query
└── pages/
    └── app/search/ui/SearchPage.vue  # Головна сторінка з інпутом і станами
```

---

### 5.2. Логіка пошуку та реактивність (`SearchPage.vue`)

#### 1. Дебаунс та синхронізація з URL:

```ts
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { useCatalogSearch } from '@/features/catalog/model/use-catalog-search.query'

const route = useRoute()
const router = useRouter()

// Локальний стан інпуту
const searchQuery = ref('')

// Дебаунс на 300 мс — запит відправляється лише після зупинки вводу
const debouncedQuery = refDebounced(searchQuery, 300)

// Відновлення запиту з URL при завантаженні сторінки
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) {
    searchQuery.value = q.trim()
  }
})

// Оновлення query параметра в URL при зміні дебаунснутого запиту
watch(debouncedQuery, (newQuery) => {
  const trimmed = newQuery.trim()
  if (trimmed) {
    router.replace({ query: { ...route.query, q: trimmed } })
  } else {
    const { q, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// Отримання даних з TanStack Query
const { data: searchResults, isFetching, isError, refetch } = useCatalogSearch(debouncedQuery)
```

#### 2. Очищення інпуту:

Якщо `searchQuery` не порожній, показуємо кнопку-хрестик (`IconX`), клік на яку скидає `searchQuery.value = ''`.

---

### 5.3. Вкладки (Tabs) фільтрації

Тип вкладок:

```ts
type SearchTab = 'all' | 'tracks' | 'artists' | 'albums'
const activeTab = ref<SearchTab>('all')
```

- **«All»**:
  - Секція «Tracks» (показуємо перші 5 знайдених треків).
  - Секція «Artists» (горизонтальна сітка з перших 4–5 артистів).
  - Секція «Albums» (сітка з перших 4–5 альбомів).
  - Біля кожного заголовка — кнопка «See all», яка перемикає активну вкладку на відповідну категорію.
- **«Tracks»**: повний список знайдених треків (до 25).
- **«Artists»**: повна сітка артистів (до 25).
- **«Albums»**: повна сітка альбомів (до 25).

Таби відображаються лише тоді, коли пошуковий запит валідний і є результати.

---

### 5.4. Відображення сутностей

#### 1. Рядок треку (`TrackRow.vue`):

- Номер треку (`index + 1`).
- Обкладинка альбому (`track.album.cover.small` або placeholder іконка).
- Назва пісні (`track.title`).
- Виконавець (`track.artist.name`).
- Альбом (`track.album.title`).
- Форматована тривалість (наприклад, 204 сек -> `3:24`).
  ```ts
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  ```

#### 2. Картка артиста (`ArtistCard.vue`):

- Кругле фото (`artist.images.medium` або `small`).
- Ім'я виконавця (`artist.name`).
- Підпис «Artist».
- Посилання на `/app/artist/:id`.

#### 3. Картка альбому (`AlbumCard.vue`):

- Квадратна обкладинка (`album.cover.medium`).
- Назва альбому (`album.title`).
- Ім'я виконавця (`album.artist.name`).
- Рік релізу (`album.releaseDate ? new Date(album.releaseDate).getFullYear() : ''`).
- Посилання на `/app/album/:id`.

---

### 5.5. Стани сторінки (UI/UX)

1. **Початковий стан (Empty query)**:
   - Якщо `debouncedQuery.trim().length < 2`.
   - Показуємо іконку пошуку, заголовок «Explore the catalog» і підказку «Search for your favorite songs, artists, or albums».
2. **Стан завантаження (Loading)**:
   - Якщо `isFetching === true`.
   - Показуємо нейтральний напис «Searching...» або акуратний skeleton.
3. **Стан помилки (Error)**:
   - Якщо `isError === true`.
   - Текст «Failed to load search results. Please check your connection and try again».
   - Кнопка «Try again» з викликом `refetch()`.
4. **Порожній результат (No results)**:
   - Якщо `searchResults` повернувся, але `tracks.items.length === 0 && artists.items.length === 0 && albums.items.length === 0`.
   - Текст: «No results found for "{searchQuery}". Check the spelling or try searching for something else.»

---

## 6. Покроковий план впровадження (Implementation Tasks)

- [ ] **Крок 1**: Створити компоненти відображення сутностей:
  - `apps/web/src/entities/track/ui/TrackRow.vue`
  - `apps/web/src/entities/artist/ui/ArtistCard.vue`
  - `apps/web/src/entities/album/ui/AlbumCard.vue`
- [ ] **Крок 2**: Створити віджет результатів пошуку `apps/web/src/widgets/search-results/ui/SearchResults.vue`:
  - Вкладки перемикання (All, Tracks, Artists, Albums).
  - Секція «All» з прев'ю блоків і кнопками «See all».
  - Окремі списки для вкладок «Tracks», «Artists», «Albums».
- [ ] **Крок 3**: Оновити `use-catalog-search.query.ts`:
  - Переконатися, що хук приймає реактивний рядок і робить запит тільки коли довжина `>= 2`.
- [ ] **Крок 4**: Оновити `apps/web/src/pages/app/search/ui/SearchPage.vue`:
  - Додати дебаунс 300 мс через `refDebounced`.
  - Додати синхронізацію з `route.query.q` (читання при відкритті, запис при зміні).
  - Додати кнопку швидкого очищення інпуту.
  - Підключити віджет `SearchResults`.
  - Оформити стани: Initial, Loading, Error, Empty.
- [ ] **Крок 5**: Перевірити роботу в додатку:
  - Ввести запит — переконатися, що результати з'являються без зависань.
  - Перевірити перемикання табів.
  - Перевірити очищення інпуту.
  - Перезавантажити сторінку з `?q=...` і переконатися, що результати відновлюються.
  - Перевірити лінтер і збірку фронтенду.

---

## 7. Критерії готовності (Definition of Done)

- [ ] Сторінка `/app/search` доступна авторизованим користувачам усередині застосунку.
- [ ] Пошуковий запит відправляється з дебаунсом 300 мс і тільки при довжині від 2 символів.
- [ ] Результати містять треки, артистів та альбоми з каталогу Deezer.
- [ ] Користувач може фільтрувати результати через таби («All», «Tracks», «Artists», «Albums»).
- [ ] У рядку треку відображаються номер, обкладинка, назва, виконавець, альбом та тривалість `х:хх`.
- [ ] Картки артистів та альбомів містять посилання на відповідні сторінки `/app/artist/:id` та `/app/album/:id`.
- [ ] Пошуковий запит зберігається в URL-параметрі `?q=...` і зберігається при перезавантаженні сторінки.
- [ ] Коректно відображаються всі стани: початковий, завантаження, помилка з кнопкою повтору, результат «Нічого не знайдено».
- [ ] `pnpm --filter @music-app/web build` і `pnpm --filter @music-app/web lint` проходять без помилок.
