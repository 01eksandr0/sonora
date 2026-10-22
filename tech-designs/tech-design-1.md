# Технічний дизайн: Задача 1 — Флоу онбордингу юзера

**Гілка:** `tech-design-1`  
**Статус:** Чернетка для реалізації  
**Автор:** Джуніор розробник  

---

## 1. Що потрібно зробити (Мета задачі)

Після того, як користувач зареєструвався, йому потрібно пройти онбординг, щоб Sonora знала його музичні смаки.

### Як це працює для юзера:
1. Юзер реєструється і автоматично потрапляє на сторінку `/app/onboarding`.
2. Якщо юзер ще не пройшов онбординг (`onboardingCompleted === false`), він не може зайти в додаток `/app` — роутер перекидає його назад на онбординг.
3. На екрані є прогрес-бар і три простих кроки:
   - **Крок 1 (Жанри):** «What pulls you in?» — вибір улюблених жанрів (Rock, Indie, Electronic тощо).
   - **Крок 2 (Артисти):** «Who is already on repeat?» — вибір виконавців (Radiohead, M83, Deftones тощо).
   - **Крок 3 (Настрій):** «What should it feel like?» — вибір настрою (Relaxed, Energized, Melancholic тощо).
4. Юзер обирає хоча б по 1 варіанту на кожному кроці, тисне **«Start listening»**, дані зберігаються в базу, а юзера перекидає на головну `/app`.
5. **Важливо:** жодних тестів не пишемо, робимо тільки саму логіку та стилі з макету!

---

## 2. Зміни в базі даних (Prisma)

Уподобання юзера зберігаємо в окремій таблиці `TasteProfile` (профіль смаку), щоб не захаращувати таблицю `User`.

У файл `apps/api/prisma/schema.prisma` додаємо:

```prisma
enum TasteSignalSource {
  ONBOARDING
  LIKE
  LISTEN
  SKIP
  MANUAL
}

// До моделі User додаємо зв'язок:
// tasteProfile TasteProfile?

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
  @@map("taste_artist_preferences")
}
```

### Команда для міграції:
```bash
pnpm --filter @music-app/api prisma:migrate:dev --name add_taste_profile
pnpm --filter @music-app/api prisma:generate
```

---

## 3. Бекенд (`apps/api`)

Робимо один простий модуль `apps/api/src/modules/onboarding/`:

### 3.1. Ендпоінти:
1. `GET /api/onboarding/options` — повертає доступні варіанти для вибору:
   - **Жанри:** Alternative, Electronic, Hip-hop, Jazz, Indie, Metal, Pop, Rock, Ambient, Classical.
   - **Артисти:** M83, FKA twigs, Deftones, Arctic Monkeys, Tame Impala, Grimes, Radiohead, Björk, Massive Attack, The Cure.
   - **Настрої:** Energized, Focused, Relaxed, Melancholic, Romantic, Restless, Happy, Dark.
2. `POST /api/onboarding` — приймає `{ genres: string[], artists: string[], moods: string[] }`:
   - Вимагає авторизації (`JwtAuthGuard`).
   - У простій транзакції `prisma.$transaction`:
     1. Створює або оновлює `TasteProfile` юзера.
     2. Додає обрані жанри в `TasteGenrePreference` з вагою `1.0`.
     3. Додає обраних артистів у `TasteArtistPreference` з вагою `1.0`.
     4. Ставить `user.onboardingCompleted = true`.
   - Повертає `{ success: true }`.

Жодних юніт-тестів чи моків не створюємо.

---

## 4. Спільні типи та клієнт (`packages/*`)

1. **`packages/shared-types`**:
   Додаємо прості інтерфейси:
   ```ts
   export interface OnboardingOptionsResponse {
     genres: string[]
     artists: string[]
     moods: string[]
   }

   export interface CompleteOnboardingRequest {
     genres: string[]
     artists: string[]
     moods: string[]
   }
   ```
2. **`packages/api-client`**:
   Додаємо два методи у виклики API:
   - `api.onboarding.getOptions()`
   - `api.onboarding.complete(data)`

---

## 5. Фронтенд (`apps/web`)

Робимо прямолінійно, без складних обгорток і без зайвих підкомпонентів — усе в одній гарній сторінці:

### 5.1. Сторінка `OnboardingPage.vue`:
Файл: `apps/web/src/pages/app/onboarding/ui/OnboardingPage.vue`
- Зверху логотип `sonora` та лічильник кроків (`1 / 3`, `2 / 3`, `3 / 3`).
- Смужка прогресу (заповнюється на 33%, 66%, 100%).
- Заголовок та підзаголовок для кожного кроку.
- Сітка кнопок-карток (`.taste-grid` та `.taste-option`):
  - При кліку додаємо/забираємо варіант зі списку вибраних.
  - Активна картка підсвічується неоновою рамкою (`var(--sonora-accent)`) та іконкою галочки `<IconCheck />`.
- Знизу дві кнопки:
  - «Back» (назад) — прихована на 1-му кроці.
  - «Continue» (далі) на кроках 1 і 2.
  - «Start listening» на 3-му кроці — відправляє дані на бекенд.

### 5.2. Збереження вибору:
- Використовуємо звичайний Pinia store або `ref` прямо в компоненті з простими масивами:
  - `selectedGenres = ref<string[]>([])`
  - `selectedArtists = ref<string[]>([])`
  - `selectedMoods = ref<string[]>([])`
  - `step = ref(0)`
- Коли тиснемо «Start listening»:
  ```ts
  await api.onboarding.complete({
    genres: selectedGenres.value,
    artists: selectedArtists.value,
    moods: selectedMoods.value,
  })
  sessionStore.onboardingCompleted = true
  router.push({ name: ROUTE_NAMES.home })
  ```

### 5.3. Навігаційний гард:
- У `apps/web/src/app/router/guards.ts` перевіряємо:
  - Якщо `user` залогінений, але `onboardingCompleted === false` ➔ пускати тільки на `/app/onboarding`.
  - Якщо онбординг уже пройдено ➔ з `/app/onboarding` перенаправляти на `/app`.

---

## 6. Простий план дій

1. **Крок 1 (БД):** Додати моделі в `schema.prisma` і накатити міграцію.
2. **Крок 2 (Типи та API):** Додати інтерфейси в `shared-types` і методи в `api-client`.
3. **Крок 3 (Бекенд):** Створити контролер і сервіс `onboarding` з двома методами (`getOptions`, `complete`).
4. **Крок 4 (Фронтенд):** Зверстати `OnboardingPage.vue` зі стилями з макету та підключити відправку на бекенд.
5. **Крок 5 (Перевірка):** Зареєструвати нового юзера, пройти 3 кроки в браузері і переконатися, що відкривається додаток.
