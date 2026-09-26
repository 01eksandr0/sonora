# Технічний дизайн: Задача 0 — Флоу реєстрації та логіну

**Статус:** Схвалено до реалізації  
**Дата:** 2026-09-26  
**Автор:** Sonora Engineering Team  
**Гілка:** `tech-design-0`  

---

## 1. Мета та контекст (Overview & Context)

### 1.1. Номер задачі та назва
- **Задача 0**: Створити флоу реєстрації та логіну (Authentication: Registration & Login Flow).

### 1.2. Посилання на ROADMAP.md
- [ROADMAP.md](../../ROADMAP.md):
  - **Розділ 10 (Authentication)**: Життєвий цикл сесії:
    ```text
    anonymous → register → registered → onboarding pending → onboarding complete → active
    ```
    Auth відповідає за: `register`, `login`, `logout`, `refresh`, `password`, `session`, `JWT`.  
    Users відповідає за: `identity`, `profile`, `preferences`, `account settings`, `onboarding status`.
  - **Розділ 11 (User)**: Контракти сутностей `User` та `UserProfile`. Заборонено зберігати уподобання безпосередньо в моделі `User`.
  - **Розділ 12 (Onboarding)**: Маршрутизація після реєстрації: створення облікового запису веде до маршруту `/app/onboarding`.
  - **Розділ 35 (Security)**: Хешування паролів (Argon2), подвійні JWT токени (access + refresh), HttpOnly/Secure cookies, ротація refresh токенів у Redis, валідація вхідних даних, rate limiting, налаштування CORS.
  - **Розділ 38 (Фази розробки, Phase 5 — Auth + Users)**: Register, Login, Logout, Refresh, Current user, Profile, Password handling, Session security.
  - **Розділ 41 (Immediate Next Steps)**: Крок 10 — Auth + Users.

### 1.3. Опис бізнес-логіки та цілей
Основною метою задачі є створення повноцінного, безпечного та візуально завершеного циклу входу користувача в музичний сервіс Sonora:
1. Новий слухач може зареєструватися за допомогою адреси електронної пошти, пароля та опціонального імені профілю (`displayName`).
2. Зареєстрований користувач отримує активну сесію та негайно перенаправляється до етапу налаштування музичного смаку (`/app/onboarding`).
3. Повертаючись, користувач може авторизуватися через форму входу (`/login`). Якщо його онбординг завершено, він перенаправляється на головний екран (`/app`), або за збереженою URL-адресою редиректу (`redirect query param`). Якщо онбординг ще не завершено — на `/app/onboarding`.
4. Сесія підтримується за допомогою безпечних `HttpOnly` cookie-файлів. При оновленні сторінки додаток автоматично відновлює профіль користувача (`GET /api/auth/me`).
5. Ротація refresh токенів виконується автоматично через Redis, що запобігає повторному використанню токенів у разі їх компрометації.
6. Інтерфейс відповідає преміальній темній естетиці Sonora (глибокий фон `#0b0b0f`, неоновий акцент `#d8f35b`, плавні мікроанімації, адаптивність під мобільні пристрої, чітка валідація та зрозумілі повідомлення про помилки).

### 1.4. Scope (Межі робіт)
- **Database**:
  - Валідація та фіксація Prisma-моделей `User` та `UserProfile` у PostgreSQL.
  - Забезпечення каскадного видалення зв'язку `UserProfile` при видаленні `User`.
  - Перевірка індексів та унікальних обмежень для швидкого пошуку за email.
- **Backend (`apps/api`)**:
  - Ендпоінти `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.
  - Хешування паролів за допомогою алгоритму Argon2id.
  - Управління сесіями через Redis (`session:{userId}:{tokenId}`) з автоматичним видаленням старого токена при оновленні (refresh token rotation).
  - Встановлення та очищення `HttpOnly` / `SameSite=Lax` cookies для `access_token` та `refresh_token`.
  - Захист ендпоінтів авторизації від brute-force підбору паролів (Rate limiting / Throttler).
  - Налаштування CORS для підтримки передачі `credentials: 'include'`.
- **Shared Packages (`packages/*`)**:
  - Експорт інтерфейсів `User`, `UserProfile`, `UserWithProfile`, `AuthResponse`, `RegisterRequest`, `LoginRequest` у `@music-app/shared-types`.
  - Методи `auth.register`, `auth.login`, `auth.logout`, `auth.refresh`, `auth.me` у `@music-app/api-client`.
- **Frontend (`apps/web`)**:
  - Реалізація сторінок `LoginPage.vue` та `RegisterPage.vue` у фірмовому стилі Sonora.
  - Розробка FSD-модулів у `features/auth`: `LoginForm.vue`, `RegisterForm.vue`, zod-схеми валідації (`auth.schema.ts`), мутації TanStack Query (`useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`).
  - Оновлення Pinia store `useSessionStore`: стан завантаження, ініціалізація сесії (`initSession`), синхронізація з `GET /api/auth/me`.
  - Оновлення роутер-гардів (`src/app/router/guards.ts`): очікування первинної ініціалізації сесії, захист приватних маршрутів (`requiresAuth`), захист публічних сторінок (редирект з `/login` та `/register` у разі активної сесії), перевірка статусу `onboardingCompleted`.
  - UI-компоненти форм у `shared/ui`: поля вводу з індикацією помилок, перемикач видимості пароля, кнопка з індикатором завантаження (spinner/loading state).

### 1.5. Non-Goals (Свідомо відкладається)
- Сторонні методи входу (Google, Apple, Spotify OAuth2).
- Повноцінне відновлення паролю через відправку реальних листів (екран `/forgot-password` реалізується як UI-заглушка з інформаційним повідомленням до підключення поштового провайдера Resend/SES).
- Безпосередній вибір жанрів та виконавців на екрані онбордингу — це окрема задача Фази 6 (Phase 6 — Onboarding).

---

## 2. Зміни в базі даних (Database / Prisma / PostgreSQL)

### 2.1. Prisma Schema (`apps/api/prisma/schema.prisma`)
Моделі автентифікації та профілю користувача розміщені в схемі згідно з принципом розділення облікового запису та профілю:

```prisma
enum MusicProvider {
  DEEZER
}

model User {
  id                  String        @id @default(uuid())
  email               String        @unique
  passwordHash        String        @map("password_hash")
  onboardingCompleted Boolean       @default(false) @map("onboarding_completed")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  profile             UserProfile?

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

  @@index([userId])
  @@map("user_profiles")
}
```

### 2.2. Правила та обмеження
1. **Ідентифікатори**: `id` генеруються як UUID v4 (`@default(uuid())`).
2. **Email**: нормалізується в нижній регістр перед збереженням. Поле позначене `@unique` та має індекс `@@index([email])` для оптимізації пошуку в PostgreSQL.
3. **Хеш паролю**: зберігається в `passwordHash` (стовпчик `password_hash`), хешується виключно за допомогою Argon2id з автоматичною сіллю.
4. **Onboarding статус**: булевий прапорець `onboarding_completed` за замовчуванням `false`. Змінюється на `true` тільки після завершення етапу вибору музичних уподобань.
5. **Каскадне видалення**: при видаленні запису `User` автоматично видаляється пов'язаний `UserProfile` (`onDelete: Cascade`).

### 2.3. План міграції
1. Генерація клієнта Prisma:
   ```bash
   pnpm --filter @music-app/api prisma:generate
   ```
2. Створення та застосування міграції для середовища розробки:
   ```bash
   pnpm --filter @music-app/api prisma:migrate
   ```

---

## 3. Бекенд реалізація (`apps/api`)

### 3.1. Модульна структура
```text
apps/api/src/
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── throttler-behind-proxy.guard.ts
│   └── filters/
│       └── http-exception.filter.ts
├── infrastructure/
│   ├── cache/
│   │   ├── cache.service.ts
│   │   └── redis.provider.ts
│   └── database/
│       └── prisma.service.ts
└── modules/
    ├── users/
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   └── users.service.spec.ts
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── auth.service.spec.ts
        ├── strategies/
        │   └── jwt.strategy.ts
        └── dto/
            ├── register.dto.ts
            ├── login.dto.ts
            └── auth-response.dto.ts
```

### 3.2. REST API ендпоінти

| Метод | Шлях | Опис | Auth | Успішний статус | Можливі помилки |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Реєстрація нового користувача | Публічний | `201 Created` | `400 Bad Request`, `409 Conflict`, `429 Too Many Requests` |
| `POST` | `/api/auth/login` | Вхід за email та паролем | Публічний | `200 OK` | `400 Bad Request`, `401 Unauthorized`, `429 Too Many Requests` |
| `POST` | `/api/auth/refresh` | Ротація токенів сесії | Cookie/Header | `200 OK` | `401 Unauthorized` |
| `POST` | `/api/auth/logout` | Завершення сесії та відкликання токена | Необов'язковий | `200 OK` | `200 OK` |
| `GET` | `/api/auth/me` | Отримання поточного профілю користувача | `JwtAuthGuard` | `200 OK` | `401 Unauthorized` |

### 3.3. DTO та валідація

#### RegisterDto (`apps/api/src/modules/auth/dto/register.dto.ts`)
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'listener@sonora.fm', description: 'User email address' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Invalid email address format' })
  email!: string

  @ApiProperty({ example: 'SonicPulse#2026', description: 'Password (min 8 chars)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  password!: string

  @ApiPropertyOptional({ example: 'Nova', description: 'Display name for profile' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  displayName?: string
}
```

#### LoginDto (`apps/api/src/modules/auth/dto/login.dto.ts`)
```typescript
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'listener@sonora.fm', description: 'Registered user email' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Invalid email address format' })
  email!: string

  @ApiProperty({ example: 'SonicPulse#2026', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string
}
```

### 3.4. Управління сесіями та Redis
1. **Структура сесії в Redis**:
   - Ключ: `session:{userId}:{tokenId}`
   - Значення: `{ "userId": string, "tokenId": string, "createdAt": string }`
   - TTL: 30 днів (дорівнює часу життя refresh токена).
2. **Refresh Token Rotation (Захист від викрадення токенів)**:
   - При виклику `POST /api/auth/refresh` поточний `tokenId` валідується через Redis.
   - Якщо ключ існує: він негайно видаляється (`cache.del(sessionKey)`), генерується новий `tokenId` та новий refresh-токен.
   - Якщо ключ відсутній або токен прострочений: запит відхиляється (`401 Unauthorized`).
3. **Logout**:
   - При виклику `POST /api/auth/logout` відповідний ключ сесії видаляється з Redis.
   - Встановлюються заголовки `Set-Cookie` з нульовим часом життя для очищення cookies на клієнті.

### 3.5. Cookie політика
- **`access_token`**:
  - `httpOnly: true` (недоступний для JavaScript, захист від XSS).
  - `secure: process.env.COOKIE_SECURE === 'true'` (увімкнено в production).
  - `sameSite: 'lax'` (захист від CSRF при крос-сайтових переходах).
  - `path: '/'` (доступний для всіх API-запитів).
  - `maxAge`: 15 хвилин (900 секунд).
- **`refresh_token`**:
  - `httpOnly: true`.
  - `secure: process.env.COOKIE_SECURE === 'true'`.
  - `sameSite: 'lax'`.
  - `path: '/api/auth'` (обмежує відправку токена лише до ендпоінтів модуля автентифікації).
  - `maxAge`: 30 днів (2,592,000 секунд).

### 3.6. Rate Limiting (Throttling)
Для захисту від brute-force атак на паролі застосовується `@nestjs/throttler`:
- Для ендпоінту `login`: максимум 5 невдалих спроб за 60 секунд з однієї IP-адреси.
- Для ендпоінту `register`: максимум 3 реєстрації за 60 секунд з однієї IP-адреси.

---

## 4. Фронтенд реалізація (`apps/web`)

### 4.1. Архітектура шарів (Feature-Sliced Design)

```text
apps/web/src/
├── app/
│   ├── router/
│   │   ├── routes.ts         # Визначення публічних та захищених маршрутів
│   │   └── guards.ts         # Навігаційні гарди перевірки сесії та онбордингу
│   └── styles/
│       └── main.css          # Дизайн-токени теми Sonora
├── entities/
│   └── user/
│       ├── model/types.ts    # Типи користувача з @music-app/shared-types
│       └── index.ts
├── features/
│   └── auth/
│       ├── model/
│       │   ├── auth.schema.ts        # Zod-схеми для форм входу та реєстрації
│       │   ├── session.store.ts      # Pinia store сесії (user, isAuthenticated, onboardingCompleted)
│       │   ├── use-login.mutation.ts # TanStack Query мутація для логіну
│       │   ├── use-register.mutation.ts # TanStack Query мутація для реєстрації
│       │   └── use-logout.mutation.ts # TanStack Query мутація для виходу
│       ├── ui/
│       │   ├── LoginForm.vue         # Компонент форми авторизації
│       │   └── RegisterForm.vue      # Компонент форми реєстрації
│       └── index.ts
├── pages/
│   ├── login/
│   │   └── ui/LoginPage.vue          # Сторінка входу (Hero, Form, Links)
│   ├── register/
│   │   └── ui/RegisterPage.vue       # Сторінка реєстрації (Hero, Form, Links)
│   └── forgot-password/
│       └── ui/ForgotPasswordPage.vue # Сторінка відновлення паролю
└── shared/
    ├── api/
    │   ├── client.ts         # Екземпляр @music-app/api-client
    │   └── query-client.ts   # Налаштування TanStack Query
    └── ui/
        ├── input/
        │   └── SonoraInput.vue       # Кастомний інпут з лейблом, помилками та іконками
        ├── button/
        │   └── SonoraButton.vue      # Акцентна кнопка зі станом loading
        └── alert/
            └── FormAlert.vue         # Банер відображення помилок API
```

### 4.2. Валідація форм (Zod)
Файл `apps/web/src/features/auth/model/auth.schema.ts`:
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
```

### 4.3. Session Store (`apps/web/src/features/auth/model/session.store.ts`)
Store забезпечує узгоджений стан автентифікації та відповідає за первинну гідрацію сесії:

```typescript
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserWithProfile } from '@music-app/shared-types'
import { api } from '@/shared/api/client'

export const useSessionStore = defineStore('session', () => {
  const user = ref<UserWithProfile | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const onboardingCompleted = computed(() => user.value?.onboardingCompleted ?? false)

  function setSession(nextUser: UserWithProfile | null) {
    user.value = nextUser
  }

  async function initSession(): Promise<UserWithProfile | null> {
    if (isInitialized.value) return user.value

    isLoading.value = true
    try {
      const currentUser = await api.auth.me()
      user.value = currentUser
      return currentUser
    } catch {
      user.value = null
      return null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  function clear() {
    user.value = null
  }

  return {
    user,
    isInitialized,
    isLoading,
    isAuthenticated,
    onboardingCompleted,
    setSession,
    initSession,
    clear,
  }
})
```

### 4.4. Логіка навігаційних гардів (`apps/web/src/app/router/guards.ts`)
Навігація підтримує строгий порядок станів:
`anonymous → register → registered → onboarding pending → onboarding complete → active`

```typescript
import type { Router } from 'vue-router'
import { useSessionStore } from '@/features/auth'
import { ROUTE_NAMES } from './routes'

export function registerGuards(router: Router) {
  router.beforeEach(async (to) => {
    const session = useSessionStore()

    // 1. Первинна ініціалізація сесії з HttpOnly cookies
    if (!session.isInitialized) {
      await session.initSession()
    }

    // 2. Якщо користувач уже авторизований і намагається перейти на сторінки входу/реєстрації
    if (session.isAuthenticated && (to.name === ROUTE_NAMES.login || to.name === ROUTE_NAMES.register)) {
      if (!session.onboardingCompleted) {
        return { name: ROUTE_NAMES.onboarding }
      }
      return { name: ROUTE_NAMES.home }
    }

    // 3. Захист приватних маршрутів (/app/*)
    if (to.meta.requiresAuth && !session.isAuthenticated) {
      return {
        name: ROUTE_NAMES.login,
        query: { redirect: to.fullPath !== '/app' ? to.fullPath : undefined },
      }
    }

    // 4. Перевірка статусу онбордингу
    if (
      to.meta.requiresAuth &&
      session.isAuthenticated &&
      !session.onboardingCompleted &&
      !to.meta.skipOnboardingCheck
    ) {
      return { name: ROUTE_NAMES.onboarding }
    }

    // 5. Якщо онбординг уже пройдено, блокувати повернення на сторінку /app/onboarding
    if (to.name === ROUTE_NAMES.onboarding && session.isAuthenticated && session.onboardingCompleted) {
      return { name: ROUTE_NAMES.home }
    }

    return true
  })
}
```

### 4.5. UI/UX та дизайн сторінок авторизації
Сторінки `LoginPage.vue` та `RegisterPage.vue` будуються відповідно до дизайн-системи Sonora:
- **Кольорова палітра**:
  - Основне тло сторінки: `var(--sonora-bg)` (`#0b0b0f`).
  - Поверхня картки форми: `var(--sonora-surface)` (`#17171e`) з тонкою рамкою `rgba(255, 255, 255, 0.07)` та легким розмиттям (glassmorphism).
  - Акцентний колір кнопок та фокусу: `var(--sonora-accent)` (`#d8f35b`).
  - Текст помилок валідації: кораловий відтінок `#ff6b6b`.
- **Елементи сторінки**:
  - Логотип-монограма бренду: `<RouterLink :to="{ name: ROUTE_NAMES.landing }" class="brand-mark"><span>so</span>nora</RouterLink>`.
  - Заголовки з використанням акцентного курсиву: наприклад, `Log in to <em>Sonora</em>` або `Tune in to <em>your frequency</em>`.
  - Поля вводу з плавною анімацією фокусу, підтримкою клавіші Enter для відправки форми, перемикачем видимості пароля (`IconEye` / `IconEyeOff`).
  - Кнопка дій із вбудованим індикатором виконання запиту (`isPending`) та блокуванням повторних кліків.
  - Посилання перемикання між "Already have an account? Log in" та "New to Sonora? Start listening".

---

## 5. Спільні контракти (`packages/*`)

### 5.1. Типи у `@music-app/shared-types`
Файл `packages/shared-types/src/user.ts`:
```typescript
export interface User {
  id: string
  email: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface UserWithProfile extends User {
  profile: UserProfile | null
}

export interface AuthResponse {
  user: UserWithProfile
  accessToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

export interface LoginRequest {
  email: string
  password: string
}
```

### 5.2. Клієнтські методи у `@music-app/api-client`
Файл `packages/api-client/src/client.ts`:
```typescript
auth: {
  register: (body: RegisterRequest) => http.post<AuthResponse>('/auth/register', { body }),
  login: (body: LoginRequest) => http.post<AuthResponse>('/auth/login', { body }),
  logout: () => http.post<{ success: boolean }>('/auth/logout'),
  refresh: () => http.post<AuthResponse>('/auth/refresh'),
  me: () => http.get<UserWithProfile>('/auth/me'),
}
```

---

## 6. Покроковий план впровадження (Implementation Tasks)

### Етап 1: База даних та спільні пакети
- [ ] Перевірити актуальність Prisma-схеми та згенерувати клієнт (`pnpm --filter @music-app/api prisma:generate`).
- [ ] Переконатися в наявності експорту всіх необхідних типів у `packages/shared-types/src/index.ts`.
- [ ] Переконатися у збірці пакетів `packages/shared-types` та `packages/api-client` (`pnpm --filter @music-app/* build`).

### Етап 2: Бекенд полірування (`apps/api`)
- [ ] Налаштувати `ThrottlerGuard` або декоратори `@Throttle()` для ендпоінтів `register` та `login` для запобігання підбору паролів.
- [ ] Перевірити CORS конфігурацію в `main.ts` для коректної обробки cookies (`credentials: true`, `origin: ['http://localhost:5173']`).
- [ ] Запустити модульні та інтеграційні тести бекенду (`pnpm --filter @music-app/api test`, `pnpm --filter @music-app/api test:e2e`).

### Етап 3: Спільні UI-компоненти форм (`apps/web/src/shared/ui`)
- [ ] Створити `SonoraInput.vue` (стилізоване поле вводу з підтримкою лейблів, підказок, станів помилок та слотів для іконок).
- [ ] Створити `SonoraButton.vue` (кнопка в стилі дизайн-системи Sonora з підтримкою станів `loading`, `disabled`, `variant="primary | ghost"`).
- [ ] Створити `FormAlert.vue` для виведення системних помилок відповіді API (наприклад, "Invalid email or password", "Email is already registered").

### Етап 4: Модуль автентифікації (`apps/web/src/features/auth`)
- [ ] Створити `auth.schema.ts` з Zod-схемами валідації для `login` та `register`.
- [ ] Оновити `session.store.ts`: додати метод `initSession()`, прапорці `isInitialized` та `isLoading`, типізацію з `UserWithProfile`.
- [ ] Створити мутації `use-register.mutation.ts`, `use-login.mutation.ts`, `use-logout.mutation.ts` за допомогою `@tanstack/vue-query`.
- [ ] Розробити компонент `RegisterForm.vue` з використанням `vee-validate`, Zod та UI-компонентів.
- [ ] Розробити компонент `LoginForm.vue` з використанням `vee-validate`, Zod та UI-компонентів.
- [ ] Написати модульні тести для `session.store` та компонентів форм (`*.spec.ts`).

### Етап 5: Сторінки авторизації (`apps/web/src/pages`)
- [ ] Реалізувати сторінку `RegisterPage.vue` з повноцінним макетом Sonora (Header, Form Card, Links).
- [ ] Реалізувати сторінку `LoginPage.vue` з повноцінним макетом Sonora.
- [ ] Оновити сторінку `ForgotPasswordPage.vue` з інформативною заглушкою та посиланням на повернення до входу.
- [ ] Оновити `src/app/router/guards.ts` для підтримки асинхронної ініціалізації сесії та коректних редиректів.

### Етап 6: Інтеграційне тестування та перевірка якості
- [ ] Провести повне наскрізне тестування флоу реєстрації:
  1. Відвідувач заходить на Landing (`/`).
  2. Натискає "Start listening" → потрапляє на `/register`.
  3. Вводить дані та успішно реєструється → автоматично створюються cookies, оновлюється стан сесії.
  4. Відбувається редирект на `/app/onboarding`.
- [ ] Провести тестування флоу входу:
  1. Користувач заходить на `/login`.
  2. Вводить коректні облікові дані → успішна авторизація.
  3. Якщо онбординг пройдено → перехід на `/app`, якщо ні → на `/app/onboarding`.
- [ ] Перевірити роботу кнопки виходу (Logout) у головному додатку.
- [ ] Запустити перевірку лінтера та збірки проекту (`pnpm lint`, `pnpm build`, `pnpm test`).

---

## 7. Definition of Done (Критерії готовності)

- [ ] Всі ендпоінти автентифікації на бекенді повертають коректні статус-коди (201, 200, 400, 401, 409) та встановлюють/очищають `HttpOnly` cookies.
- [ ] Сторінки `/register` та `/login` повністю зверстані згідно з дизайном Sonora, не містять заглушок та адаптовані до мобільних екранів.
- [ ] Клієнтська валідація запобігає відправці некоректних даних (короткий пароль, неправильний email) з виведенням зрозумілих помилок.
- [ ] Помилки сервера (дублікат email, невірний пароль) відображаються у формі без зависання інтерфейсу.
- [ ] Захищені роути блокують доступ неавторизованим користувачам; авторизовані користувачі не мають доступу до екранів входу та реєстрації.
- [ ] Всі тести проходять успішно:
  - `pnpm --filter @music-app/api test`
  - `pnpm --filter @music-app/api test:e2e`
  - `pnpm --filter @music-app/web test`
- [ ] Лінтер і збірка проходять без зауважень:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm format:check`
