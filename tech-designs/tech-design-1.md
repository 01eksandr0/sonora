# Технічний дизайн: Задача 1 — Флоу онбордингу користувача (User Onboarding Flow)

**Статус:** Схвалено до реалізації  
**Дата:** 2026-10-20  
**Автор:** Sonora Engineering Team  
**Гілка:** `tech-design-1`

---

## 1. Мета та контекст (Overview & Context)

### 1.1. Номер задачі та назва

- **Задача 1**: Створити флоу онбордингу юзера — бекенд і фронтенд відповідно до макету (User Onboarding Flow: Genres, Artists, Moods & Taste Profile).

### 1.2. Посилання на ROADMAP.md

- [ROADMAP.md](../../ROADMAP.md):
  - **Розділ 4 (Frontend Architecture, FSD)**:
    - `pages/app/onboarding`
    - `features/onboarding`
  - **Розділ 5 (Routing)**:
    - Маршрут онбордингу: `/app/onboarding` (вимагає автентифікації).
    - Життєвий цикл переходу:
      ```text
      anonymous → landing → login/register → authenticated → onboarding → application
      ```
    - Обов'язкове правило: якщо `onboardingCompleted === false`, будь-який перехід у `/app/*` перенаправляється на `/app/onboarding`. Якщо онбординг пройдено — доступ до `/app/onboarding` перенаправляє на `/app`.
  - **Розділ 6 (Frontend State Management)**:
    - Pinia store: `onboarding draft` (вибір жанрів, артистів, настрою, поточний крок).
    - TanStack Query: мутація завершення онбордингу та інвалідація поточного користувача.
  - **Розділ 7–9 (Backend Architecture & Domains)**:
    - Модуль `apps/api/src/modules/onboarding/`.
    - Доменні залежності: `Onboarding ──► Users, Catalog`.
  - **Розділ 10 (Authentication & User Lifecycle)**:
    - Життєвий цикл облікового запису:
      ```text
      anonymous → register → registered → onboarding pending → onboarding complete → active
      ```
  - **Розділ 11 (User Model)**:
    - Заборонено зберігати уподобання (`preferences`) безпосередньо в моделі `User`. Необхідно використовувати відокремлений профіль смаку (`TasteProfile`).
  - **Розділ 12 (Onboarding Flow)**:
    - Сценарій:
      ```text
      /register → account created → /app/onboarding → genres → artists → moods
        → POST /api/onboarding → /app
      ```
    - Frontend зберігає проміжний стан у Pinia, на останньому кроці відправляється єдиний payload.
    - Backend виконує збереження транзакційно (`prisma.$transaction`).
  - **Розділ 13 (Taste Profile)**:
    - `Onboarding → TasteProfile → Recommendations`.
    - Збереження зважених уподобань (`TasteGenre`, `TasteArtist`, `moods`, `languages`) з джерелом сигналу `TasteSignalSource.ONBOARDING` та базовою вагою `1.0`.
  - **Розділ 38 (Фази розробки, Phase 6 — Onboarding)**:
    - Вибір жанрів, артистів, настроїв, чернетка в Pinia, валідація, `POST /api/onboarding`, транзакція бази даних, перемикання прапорця `onboardingCompleted`.

### 1.3. Опис бізнес-логіки та макету

Флоу онбордингу є першим інтерактивним кроком нового слухача після реєстрації в Sonora. Він перетворює щойно створений обліковий запис на персоналізований профіль смаку (`TasteProfile`), на основі якого в майбутньому будуватимуться рекомендації, добірки та мікси.

Відповідно до референс-макету (`music-streaming-design-8c9/app/routes/onboarding.tsx` та `app/global.css`), інтерфейс онбордингу має такі ключові характеристики:

1. **Мінімалістична та естетична шапка (`.onboarding-header`):**
   - Фірмовий логотип `brand-mark` (`so`nora) з акцентним кольором.
   - Індикатор кроку в правому кутку: `1 / 3`, `2 / 3`, `3 / 3`.
2. **Анімований прогрес-бар (`.onboarding-progress`):**
   - Тонка темна лінія (`#292930`, 3px).
   - Акцентний неоновий індикатор (`var(--sonora-accent)` `#d8f35b`), ширина якого плавно змінюється відповідно до поточного кроку (`33%` → `66%` → `100%`).
3. **Кроки вибору смаку (Steps):**
   - **Крок 1: Жанри (Genres):**
     - Eyebrow: `Your listening profile`
     - Заголовок `h1`: `What pulls you in?`
     - Підзаголовок: `Choose a few. You can always change your mind.`
     - Опції (мультиселект): _Alternative, Electronic, Hip-hop, Jazz, Indie, Metal, Pop, Rock_ тощо.
   - **Крок 2: Улюблені виконавці (Artists):**
     - Eyebrow: `Your listening profile`
     - Заголовок `h1`: `Who is already on repeat?`
     - Підзаголовок: `Choose a few. You can always change your mind.`
     - Опції (мультиселект): _M83, FKA twigs, Deftones, Arctic Monkeys, Tame Impala, Grimes, Radiohead, Björk_ тощо.
   - **Крок 3: Настрій та атмосфера (Moods):**
     - Eyebrow: `Your listening profile`
     - Заголовок `h1`: `What should it feel like?`
     - Підзаголовок: `Choose a few. You can always change your mind.`
     - Опції (мультиселект): _Energized, Focused, Relaxed, Melancholic, Romantic, Restless, Happy, Dark_ тощо.
4. **Картки опцій (`.taste-grid` та `.taste-option`):**
   - Двоколонкова сітка (в мобільній версії 1 колонка).
   - Фон `#15151b`, рамка `1px solid #292930`, радіус `9px`, паддінг `17px`.
   - При наведенні або виборі: фон `#22252a`, рамка `var(--sonora-accent)`.
   - При активації опції праворуч з'являється неонова галочка `<IconCheck :size="17" />`.
5. **Нижня панель дій (`.onboarding-actions`):**
   - Кнопка повернення назад: `.quiet-button` з іконкою `<IconChevronLeft :size="16" /> Back` (прихована на кроці 1).
   - Кнопка продовження: `.primary-button` з іконкою `Continue <IconArrowRight :size="16" />`.
   - На фінальному кроці: кнопка сабміту `Start listening <IconArrowRight :size="16" />`.
   - При натисканні на фінальному кроці відправляється `POST /api/onboarding`, користувач отримує оновлену сесію (`onboardingCompleted: true`) і перенаправляється на головний екран `/app`.

### 1.4. Scope (Межі робіт)

- **Database (Prisma / PostgreSQL)**:
  - Створення `enum TasteSignalSource` (`ONBOARDING`, `LIKE`, `LISTEN`, `SKIP`, `MANUAL`).
  - Створення моделі `TasteProfile` (зв'язок 1:1 з `User`).
  - Створення моделі `TasteGenrePreference` (зважені уподобання жанрів).
  - Створення моделі `TasteArtistPreference` (зважені уподобання артистів).
  - Підтримка списків настроїв (`moods: String[]`) та мовних переваг (`languages: String[]`).
  - Створення міграції Prisma.
- **Backend (`apps/api`)**:
  - Модуль `OnboardingModule`: `onboarding.controller.ts`, `onboarding.service.ts`.
  - `GET /api/onboarding/options` — повертає доступні списки жанрів, популярних артистів та настроїв для вибору.
  - `GET /api/onboarding/state` — повертає поточний статус онбордингу та збережений профіль користувача.
  - `POST /api/onboarding` — приймає єдиний payload з вибором, у транзакції зберігає `TasteProfile`, формує записи з вагою `1.0` та джерелом `ONBOARDING`, виставляє `User.onboardingCompleted = true`.
  - Захист ендпоінтів через `JwtAuthGuard`.
  - Unit-тести для `OnboardingService`.
- **Shared Packages (`packages/*`)**:
  - `@music-app/shared-types`: типи `TasteSignalSource`, `TasteProfile`, `TasteGenrePreference`, `TasteArtistPreference`, `OnboardingOptionsResponse`, `CompleteOnboardingRequest`, `OnboardingResponse`.
  - `@music-app/api-client`: методи `onboarding.getOptions()`, `onboarding.getState()`, `onboarding.complete(data)`.
- **Frontend (`apps/web`)**:
  - Реалізація сторінки `apps/web/src/pages/app/onboarding/ui/OnboardingPage.vue` з повною відповідністю стилям макету `.onboarding-page`.
  - Створення Pinia store `useOnboardingStore` у `features/onboarding/model/onboarding.store.ts` для зберігання вибору між кроками.
  - TanStack Query мутація `useCompleteOnboardingMutation` для виклику бекенду.
  - Обробка станів завантаження кнопки (`Working…` / `Start listening`).
  - Навігаційний гард: автоматичний перехід на `/app` після успішного збереження, захист від повторного проходження.

### 1.5. Non-Goals (Свідомо відкладається)

- Автоматичний пошук довільних артистів через Deezer API безпосередньо під час онбордингу (пошук підключається в задачі каталогу).
- Складний алгоритм перерахунку ваг за тривалим прослуховуванням (реалізується у Phase 9 — History & Signals).
- Сторінкове редагування профілю смаку (реалізується у Phase 11 — Settings/Profile).

---

## 2. Зміни в базі даних (Database / Prisma / PostgreSQL)

### 2.1. Prisma Schema (`apps/api/prisma/schema.prisma`)

Відповідно до розділів 11 та 13 [ROADMAP.md](../../ROADMAP.md), уподобання користувача зберігаються у виділеній моделі `TasteProfile`:

```prisma
enum TasteSignalSource {
  ONBOARDING
  LIKE
  LISTEN
  SKIP
  MANUAL
}

model User {
  id                  String        @id @default(uuid())
  email               String        @unique
  passwordHash        String        @map("password_hash")
  onboardingCompleted Boolean       @default(false) @map("onboarding_completed")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  profile             UserProfile?
  tasteProfile        TasteProfile?

  @@index([email])
  @@map("users")
}

model UserProfile {
  id          String    @id @default(uuid())
  userId      String    @unique @map("user_id")
  displayName String?   @map("display_name")
  avatarUrl   String?   @map("avatar_url")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model TasteProfile {
  id          String                   @id @default(uuid())
  userId      String                   @unique @map("user_id")
  moods       String[]                 @default([])
  languages   String[]                 @default([])
  createdAt   DateTime                 @default(now()) @map("created_at")
  updatedAt   DateTime                 @updatedAt @map("updated_at")

  user        User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  genres      TasteGenrePreference[]
  artists     TasteArtistPreference[]

  @@map("taste_profiles")
}

model TasteGenrePreference {
  id          String            @id @default(uuid())
  profileId   String            @map("profile_id")
  genre       String
  weight      Float             @default(1.0)
  source      TasteSignalSource @default(ONBOARDING)
  createdAt   DateTime          @default(now()) @map("created_at")

  profile     TasteProfile      @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, genre])
  @@index([profileId])
  @@map("taste_genre_preferences")
}

model TasteArtistPreference {
  id          String            @id @default(uuid())
  profileId   String            @map("profile_id")
  artistName  String            @map("artist_name")
  weight      Float             @default(1.0)
  source      TasteSignalSource @default(ONBOARDING)
  createdAt   DateTime          @default(now()) @map("created_at")

  profile     TasteProfile      @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, artistName])
  @@index([profileId])
  @@map("taste_artist_preferences")
}
```

### 2.2. План міграції та перевірка

1. Запуск генерації міграції у локальному оточенні:
   ```bash
   pnpm --filter @music-app/api prisma:migrate:dev --name add_onboarding_and_taste_profile
   ```
2. Генерація оновленого Prisma Client:
   ```bash
   pnpm --filter @music-app/api prisma:generate
   ```

---

## 3. Бекенд реалізація (`apps/api`)

### 3.1. Структура модуля `apps/api/src/modules/onboarding/`

```text
apps/api/src/modules/onboarding/
├── dto/
│   ├── complete-onboarding.dto.ts
│   ├── onboarding-options.dto.ts
│   └── taste-profile-response.dto.ts
├── onboarding.controller.ts
├── onboarding.service.ts
├── onboarding.service.spec.ts
└── onboarding.module.ts
```

### 3.2. REST API Ендпоінти

| Метод  | Ендпоінт                  | Опис                                                           | Авторизація               | Коди відповідей                                 |
| :----- | :------------------------ | :------------------------------------------------------------- | :------------------------ | :---------------------------------------------- |
| `GET`  | `/api/onboarding/options` | Отримання переліку рекомендованих жанрів, артистів та настроїв | Не обов'язкова (або JWT)  | `200 OK`                                        |
| `GET`  | `/api/onboarding/state`   | Перевірка поточного стану онбордингу слухача                   | Потрібна (`JwtAuthGuard`) | `200 OK`, `401 Unauthorized`                    |
| `POST` | `/api/onboarding`         | Збереження вибору смаку та фіналізація онбордингу              | Потрібна (`JwtAuthGuard`) | `200 OK`, `400 Bad Request`, `401 Unauthorized` |

### 3.3. DTO та валідація

#### `CompleteOnboardingDto` (`complete-onboarding.dto.ts`):

```ts
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CompleteOnboardingDto {
  @ApiProperty({ example: ['Alternative', 'Electronic', 'Indie'], description: 'Обрані жанри' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Будь ласка, оберіть хоча б один жанр' })
  @ArrayMaxSize(15)
  @IsString({ each: true })
  genres!: string[]

  @ApiProperty({ example: ['M83', 'Radiohead', 'Deftones'], description: 'Обрані виконавці' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Будь ласка, оберіть хоча б одного виконавця' })
  @ArrayMaxSize(20)
  @IsString({ each: true })
  artists!: string[]

  @ApiProperty({ example: ['Melancholic', 'Focused'], description: 'Обрані настрої' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Будь ласка, оберіть хоча б один настрій' })
  @ArrayMaxSize(10)
  @IsString({ each: true })
  moods!: string[]

  @ApiProperty({ example: ['en', 'uk'], required: false, description: 'Мовні уподобання' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[]
}
```

### 3.4. Бізнес-логіка `OnboardingService`

- **Метод `getOptions()`**:
  - Повертає статичний або конфігурований список базових жанрів, популярних артистів та настроїв Sonora згідно з макетом:
    - **Genres**: Alternative, Electronic, Hip-hop, Jazz, Indie, Metal, Pop, Rock, Ambient, Classical.
    - **Artists**: M83, FKA twigs, Deftones, Arctic Monkeys, Tame Impala, Grimes, Radiohead, Björk, Massive Attack, The Cure.
    - **Moods**: Energized, Focused, Relaxed, Melancholic, Romantic, Restless, Happy, Dark.
    - **Languages**: English, Ukrainian, Spanish, French, German, Japanese.
- **Метод `completeOnboarding(userId: string, dto: CompleteOnboardingDto)`**:
  - Виконує операцію транзакційно через `this.prisma.$transaction(async (tx) => { ... })`:
    1. Перевіряє існування користувача.
    2. Очищує або створює `TasteProfile` користувача:
       ```ts
       const tasteProfile = await tx.tasteProfile.upsert({
         where: { userId },
         create: {
           userId,
           moods: dto.moods,
           languages: dto.languages ?? [],
         },
         update: {
           moods: dto.moods,
           languages: dto.languages ?? [],
         },
       })
       ```
    3. Видаляє попередні `ONBOARDING`-уподобання для уникнення дублікатів при повторному проходженні.
    4. Створює пакет записів `TasteGenrePreference` з `weight = 1.0` та `source = ONBOARDING`.
    5. Створює пакет записів `TasteArtistPreference` з `weight = 1.0` та `source = ONBOARDING`.
    6. Оновлює стан користувача `tx.user.update({ where: { id: userId }, data: { onboardingCompleted: true } })`.
  - Повертає об'єкт з оновленими даними користувача та профілем смаку.

---

## 4. Фронтенд реалізація (`apps/web`)

### 4.1. Архітектура шарів за FSD

```text
apps/web/src/
├── pages/app/onboarding/
│   ├── ui/
│   │   └── OnboardingPage.vue
│   └── index.ts
├── features/onboarding/
│   ├── model/
│   │   ├── onboarding.store.ts
│   │   ├── use-onboarding-options.query.ts
│   │   └── use-complete-onboarding.mutation.ts
│   ├── ui/
│   │   ├── OnboardingHeader.vue
│   │   ├── OnboardingProgressBar.vue
│   │   └── TasteOptionButton.vue
│   └── index.ts
```

### 4.2. Стан у Pinia (`features/onboarding/model/onboarding.store.ts`)

Згідно з ROADMAP.md (Розділ 12), клієнтський драфт зберігається в Pinia:

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useOnboardingStore = defineStore('onboarding-draft', () => {
  const step = ref(0)
  const selectedGenres = ref<string[]>([])
  const selectedArtists = ref<string[]>([])
  const selectedMoods = ref<string[]>([])

  function toggleGenre(genre: string) {
    if (selectedGenres.value.includes(genre)) {
      selectedGenres.value = selectedGenres.value.filter((g) => g !== genre)
    } else {
      selectedGenres.value.push(genre)
    }
  }

  function toggleArtist(artist: string) {
    if (selectedArtists.value.includes(artist)) {
      selectedArtists.value = selectedArtists.value.filter((a) => a !== artist)
    } else {
      selectedArtists.value.push(artist)
    }
  }

  function toggleMood(mood: string) {
    if (selectedMoods.value.includes(mood)) {
      selectedMoods.value = selectedMoods.value.filter((m) => m !== mood)
    } else {
      selectedMoods.value.push(mood)
    }
  }

  const isCurrentStepValid = computed(() => {
    if (step.value === 0) return selectedGenres.value.length > 0
    if (step.value === 1) return selectedArtists.value.length > 0
    if (step.value === 2) return selectedMoods.value.length > 0
    return false
  })

  function nextStep() {
    if (step.value < 2) step.value++
  }

  function prevStep() {
    if (step.value > 0) step.value--
  }

  function reset() {
    step.value = 0
    selectedGenres.value = []
    selectedArtists.value = []
    selectedMoods.value = []
  }

  return {
    step,
    selectedGenres,
    selectedArtists,
    selectedMoods,
    isCurrentStepValid,
    toggleGenre,
    toggleArtist,
    toggleMood,
    nextStep,
    prevStep,
    reset,
  }
})
```

### 4.3. Верстка та стилі (`OnboardingPage.vue`)

Повністю відтворює естетику Sonora з `global.css`:

```html
<template>
  <div class="onboarding-page">
    <header class="onboarding-header">
      <RouterLink class="brand-mark" to="/"> <span>so</span>nora </RouterLink>
      <span>{{ store.step + 1 }} / 3</span>
    </header>

    <main class="onboarding-main">
      <div class="onboarding-progress">
        <span :style="{ width: `${((store.step + 1) / 3) * 100}%` }" />
      </div>

      <p class="eyebrow accent-text">Your listening profile</p>
      <h1>{{ currentStepMeta.title }}</h1>
      <p class="onboarding-sub">Choose a few. You can always change your mind.</p>

      <div class="taste-grid">
        <button
          v-for="item in currentStepMeta.options"
          :key="item"
          type="button"
          class="taste-option"
          :class="{ 'is-selected': isSelected(item) }"
          @click="toggleItem(item)"
        >
          <span>{{ item }}</span>
          <IconCheck v-if="isSelected(item)" :size="17" />
        </button>
      </div>

      <p v-if="errorMessage" class="onboarding-error">{{ errorMessage }}</p>

      <div class="onboarding-actions">
        <button v-if="store.step > 0" type="button" class="quiet-button" @click="store.prevStep">
          <IconChevronLeft :size="16" /> Back
        </button>
        <span v-else />

        <button
          v-if="store.step < 2"
          type="button"
          class="primary-button"
          :disabled="!store.isCurrentStepValid"
          @click="store.nextStep"
        >
          Continue <IconArrowRight :size="16" />
        </button>

        <button
          v-else
          type="button"
          class="primary-button"
          :disabled="!store.isCurrentStepValid || isSubmitting"
          @click="completeOnboarding"
        >
          {{ isSubmitting ? 'Working…' : 'Start listening' }}
          <IconArrowRight :size="16" />
        </button>
      </div>
    </main>
  </div>
</template>
```

Стилізовано через відповідні класи:

- `.onboarding-page` (фон `var(--sonora-bg)` `#0b0b0f`, `min-height: 100vh`).
- `.onboarding-progress` (фон `#292930`, висота `3px`, маргін `65px`).
- `.taste-grid` (`display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr)`).
- `.taste-option` (фон `#15151b`, рамка `1px solid #292930`, ховер та активний стан `#22252a` + `var(--sonora-accent)`).
- `.onboarding-actions` (`display: flex; justify-content: space-between; margin-top: 40px`).

### 4.4. Навігаційні гарди (`src/app/router/guards.ts`)

- Якщо авторизований користувач переходить на будь-який приватний маршрут (`/app`, `/app/search` тощо), але `user.onboardingCompleted === false` — виконується безумовний редирект на `/app/onboarding`.
- Якщо користувач з `user.onboardingCompleted === true` намагається відкрити `/app/onboarding` — редирект на `/app`.

---

## 5. Спільні контракти (`packages/*`)

### 5.1. `@music-app/shared-types`

Файл `packages/shared-types/src/onboarding.ts`:

```ts
export enum TasteSignalSource {
  ONBOARDING = 'ONBOARDING',
  LIKE = 'LIKE',
  LISTEN = 'LISTEN',
  SKIP = 'SKIP',
  MANUAL = 'MANUAL',
}

export interface TasteGenrePreference {
  id: string
  genre: string
  weight: number
  source: TasteSignalSource
}

export interface TasteArtistPreference {
  id: string
  artistName: string
  weight: number
  source: TasteSignalSource
}

export interface TasteProfile {
  id: string
  userId: string
  moods: string[]
  languages: string[]
  genres?: TasteGenrePreference[]
  artists?: TasteArtistPreference[]
}

export interface OnboardingOptionsResponse {
  genres: string[]
  artists: string[]
  moods: string[]
  languages?: string[]
}

export interface CompleteOnboardingRequest {
  genres: string[]
  artists: string[]
  moods: string[]
  languages?: string[]
}

export interface OnboardingResponse {
  success: boolean
  tasteProfile: TasteProfile
}
```

Експорт додається до `packages/shared-types/src/index.ts`.

### 5.2. `@music-app/api-client`

Методи клієнта в `packages/api-client/src/client.ts`:

```ts
export class OnboardingApi {
  constructor(private readonly http: HttpClient) {}

  async getOptions(): Promise<OnboardingOptionsResponse> {
    return this.http.get<OnboardingOptionsResponse>('/api/onboarding/options')
  }

  async getState(): Promise<{ onboardingCompleted: boolean; tasteProfile: TasteProfile | null }> {
    return this.http.get('/api/onboarding/state')
  }

  async complete(data: CompleteOnboardingRequest): Promise<OnboardingResponse> {
    return this.http.post<OnboardingResponse>('/api/onboarding', data)
  }
}
```

---

## 6. Покроковий план впровадження (Implementation Tasks)

- [ ] **Крок 1: База даних (Prisma & PostgreSQL)**
  - [ ] Оновити `apps/api/prisma/schema.prisma`: додати `enum TasteSignalSource`, моделі `TasteProfile`, `TasteGenrePreference`, `TasteArtistPreference`.
  - [ ] Додати зв'язок `tasteProfile TasteProfile?` у модель `User`.
  - [ ] Згенерувати та застосувати міграцію `add_onboarding_and_taste_profile`.
  - [ ] Оновити сгенерований Prisma Client (`prisma:generate`).

- [ ] **Крок 2: Спільні типи (`@music-app/shared-types`)**
  - [ ] Створити `packages/shared-types/src/onboarding.ts` з інтерфейсами та enum.
  - [ ] Реекспортувати типи у `packages/shared-types/src/index.ts`.
  - [ ] Зібрати пакет `pnpm --filter @music-app/shared-types build`.

- [ ] **Крок 3: Бекенд реалізація (`apps/api`)**
  - [ ] Створити `apps/api/src/modules/onboarding/dto/complete-onboarding.dto.ts`.
  - [ ] Реалізувати `OnboardingService`: методи `getOptions()`, `getState()`, транзакційний `completeOnboarding()`.
  - [ ] Реалізувати `OnboardingController` з ендпоінтами `/api/onboarding/options`, `/api/onboarding/state`, `/api/onboarding`.
  - [ ] Зареєструвати `OnboardingModule` в `app.module.ts`.
  - [ ] Написати юніт-тести `onboarding.service.spec.ts`.

- [ ] **Крок 4: Клієнтський SDK (`@music-app/api-client`)**
  - [ ] Додати клас `OnboardingApi` з викликами `/api/onboarding/*`.
  - [ ] Інтегрувати в кореневий клієнт `SonoraClient.onboarding`.
  - [ ] Зібрати пакет `pnpm --filter @music-app/api-client build`.

- [ ] **Крок 5: Фронтенд онбордингу (`apps/web`)**
  - [ ] Створити Pinia store `useOnboardingStore` (`features/onboarding/model/onboarding.store.ts`).
  - [ ] Створити мутацію `useCompleteOnboardingMutation` (`features/onboarding/model/use-complete-onboarding.mutation.ts`).
  - [ ] Перенести стилі онбордингу з референсу (`.onboarding-page`, `.onboarding-header`, `.onboarding-progress`, `.taste-grid`, `.taste-option`, `.onboarding-actions`, `.quiet-button`) до `main.css` або scoped стилів.
  - [ ] Реалізувати компонент сторінки `pages/app/onboarding/ui/OnboardingPage.vue`.
  - [ ] Оновити навігаційний гард `guards.ts` для суворого контролю прапорця `onboardingCompleted`.

- [ ] **Крок 6: Перевірка та верифікація**
  - [ ] Перевірити реєстрацію нового користувача з автоматичним перенаправленням на `/app/onboarding`.
  - [ ] Перевірити вибір жанрів, артистів, настроїв з плавним прогрес-баром.
  - [ ] Перевірити збереження вибору в базі даних та успішний редирект на `/app`.
  - [ ] Перевірити проходження typecheck, linter та тестів.

---

## 7. Definition of Done (Критерії готовності)

- [ ] Prisma міграція успішно застосовується до PostgreSQL без втрати існуючих даних.
- [ ] Ендпоінт `POST /api/onboarding` валідує вхідні масиви даних і транзакційно зберігає профіль смаку.
- [ ] Моделі `TasteGenrePreference` та `TasteArtistPreference` заповнюються з вагою `1.0` і джерелом `ONBOARDING`.
- [ ] Поле `User.onboardingCompleted` перемикається на `true`.
- [ ] Сторінка `/app/onboarding` візуально та функціонально відповідає референс-макету Sonora (включаючи стан вибору, галочки та прогрес).
- [ ] Роутер блокує доступ до внутрішніх сторінок сервісу для користувачів з незавершеним онбордингом.
- [ ] Всі тести проходять (`pnpm test`).
- [ ] TypeScript перевірка без помилок (`pnpm -r typecheck`).
- [ ] Код відформатовано згідно з Prettier (`pnpm format:check`).
