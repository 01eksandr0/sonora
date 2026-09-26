---
name: tech-design
description: >-
  Створює детальний техдизайн (Technical Design Document) на основі ROADMAP.md,
  описує зміни для бекенду (NestJS), фронтенду (Vue 3 FSD), бази даних (Prisma/PostgreSQL),
  зберігає документ у папку tech-designs/, створює гілку tech-design-{номер} та оформлює Pull Request.
  Активуйте, коли користувач просить скласти техдизайн, архітектурний план чи ТЗ для задачі з роадмапу.
---

# Скіл: Техдизайн (Tech Design)

Цей скіл призначений для створення вичерпних технічних дизайнів задач для проекту **Sonora** на основі [ROADMAP.md](../../../ROADMAP.md) з подальшою автоматизацією створення гілки, коміту та Pull Request.

---

## Робочий процес (Workflow)

```mermaid
graph TD
    A[Отримати задачу від користувача] --> B[Знайти розділ та вимоги в ROADMAP.md]
    B --> C[Проаналізувати поточний стан кодової бази]
    C --> D[Скласти детальний техдизайн за шаблоном]
    D --> E[Зберегти файл у tech-designs/tech-design-{номер}.md]
    E --> F[Створити гілку git checkout -b tech-design-{номер}]
    F --> G[Зробити коміт та git push]
    G --> H[Створити Pull Request через gh pr create або надати пряме посилання]
```

---

## Крок 1. Аналіз задачі та пошук у ROADMAP.md

1. **Визначити номер та назву задачі**:
   - Якщо користувач вказав номер (наприклад, `15`, `Phase 3`, `#26`, `Catalog`):
     - Знайти відповідний розділ у [ROADMAP.md](../../../ROADMAP.md) (секції 1–42, фази 1–14).
     - Якщо вказано номер секції (наприклад, `15. CATALOG` або `27. Playlists`), використовувати його як номер задачі: `15`, `27` тощо.
     - Якщо задача береться з фаз розробки (секція 38, наприклад `Phase 3 — Catalog`), використовувати формат `03` або номер пункту.
2. **Зібрати вимоги з роадмапу**:
   - Перевірити залежності домену (розділи 8–9: `Auth`, `Users`, `Catalog`, `Playlists`, `Library`, `History`, `Recommendations`).
   - Перевірити канонічні моделі (розділи 18–20: `Track`, `Artist`, `Album`, `Genre`).
   - Перевірити стратегію збереження та кешування (розділи 24, 30: Redis, PostgreSQL).
   - Перевірити архітектуру бекенду (розділ 7: NestJS domain modules) та фронтенду (розділ 4: FSD layers).
3. **Перевірити поточний стан репозиторію**:
   - База даних: `apps/api/prisma/schema.prisma`.
   - Бекенд: `apps/api/src/modules/`.
   - Фронтенд: `apps/web/src/pages/`, `widgets/`, `features/`, `entities/`.
   - Спільні пакети: `packages/shared-types`, `packages/api-client`.

---

## Крок 2. Структура документу техдизайну

Документ повинен містити такі обов'язкові розділи:

### 1. Мета та контекст (Overview & Context)

- Номер задачі та назва.
- Посилання на відповідний пункт [ROADMAP.md](../../../ROADMAP.md).
- Короткий опис бізнес-логіки та цілей задачі.
- Scope (що входить) та Non-Goals (що свідомо відкладається на наступні фази).

### 2. Зміни в базі даних (Database / Prisma / PostgreSQL)

- Нові або оновлені Prisma моделі, поля, типи, enums.
- Точний фрагмент схеми для `prisma/schema.prisma`.
- Індекси (`@@index`), унікальні обмеження (`@@unique`), foreign keys (`@relation`).
- План міграції: `pnpm --filter @music-app/api prisma:migrate:dev` або `prisma db push`.
- Дані для сідів (`seed.ts`), якщо потрібні початкові довідники.

### 3. Бекенд реалізація (`apps/api`)

- **Модульна структура**:
  - `apps/api/src/modules/<name>/` (`<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`).
- **REST API ендпоінти**:
  - HTTP метод, точний шлях, query параметри, body, response codes (200, 201, 400, 401, 403, 404).
  - DTO з декораторами валідації (`class-validator`) та Swagger (`@ApiProperty`).
- **Бізнес-логіка та сервіси**:
  - Алгоритми обробки даних, транзакції (`prisma.$transaction`).
  - Інтеграція з зовнішніми провайдерами (наприклад, Deezer API через `MusicProvider`).
  - Кешування в Redis (`CacheService`): ключі, TTL, інвалідація.
- **Безпека та авторизація**:
  - Guards (`@UseGuards(JwtAuthGuard)`), поточний користувач (`@CurrentUser()`).
  - Перевірка прав доступу (власник плейлиста, приватність).
- **Тестування**:
  - План юніт-тестів (`*.service.spec.ts`).
  - План e2e/інтеграційних тестів (`test/*.e2e-spec.ts`).

### 4. Фронтенд реалізація (`apps/web`)

- **FSD шари**:
  - `pages/`: маршрути та сторінки.
  - `widgets/`: складні композиційні блоки.
  - `features/`: інтерактивні сценарії користувача.
  - `entities/`: бізнес-сутності, карточки, рядки списків.
  - `shared/`: переиспользувані UI-компоненти, API-клієнт, утиліти.
- **Маршрутизація (`router/routes.ts`)**:
  - Назви маршрутів (`ROUTE_NAMES`), перевірка автентифікації (`requiresAuth`).
- **State Management**:
  - TanStack Query: query keys, query options, mutations, інвалідація кешу.
  - Pinia stores: локальний стан UI, плеєр, черга, чернетки форм.
- **UI & UX стани**:
  - Дизайн-токени (`--sonora-bg`, `--sonora-accent`, `--sonora-text` тощо).
  - Стан завантаження (Skeleton / Spinner), помилки (Error banner), порожній стан (Empty state).
- **Валідація форм**: `vee-validate` + `zod` (якщо є форми).
- **Тестування**: Vitest компонентні тести, Playwright smoke тести.

### 5. Спільні контракти (`packages/*`)

- `packages/shared-types`: спільні TypeScript інтерфейси, DTO типи, enums.
- `packages/api-client`: методи для виклику нових API ендпоінтів.

### 6. Покроковий план впровадження (Implementation Tasks)

- Чек-лист підзадач з чекбоксами `[ ]`.
- Порядок виконання (наприклад: `1. Database → 2. Shared Types → 3. Backend → 4. API Client → 5. Frontend`).

### 7. Definition of Done (Критерії готовності)

- [ ] Міграції застосовані.
- [ ] Бекенд тести пройдені (`pnpm --filter @music-app/api test`).
- [ ] Фронтенд тести пройдені (`pnpm --filter @music-app/web test`).
- [ ] Лінтер і збірка проходять без помилок (`pnpm build`, `pnpm lint`).
- [ ] Код відформатовано (`pnpm format:check`).

---

## Крок 3. Збереження файлу техдизайну

1. Переконатися, що директорія `tech-designs/` існує в корені репозиторію (якщо ні — створити).
2. Назва файлу: `tech-designs/tech-design-{номер}.md`
   _(наприклад: `tech-designs/tech-design-15.md` або `tech-designs/tech-design-03.md`)_.

---

## Крок 4. Створення гілки, коміту та Pull Request

1. **Перевірити поточний статус git**:
   ```bash
   git status
   ```
2. **Створити та переключитися на нову гілку**:
   ```bash
   git checkout -b tech-design-{номер}
   ```
3. **Додати файл техдизайну та зробити коміт**:
   ```bash
   git add tech-designs/tech-design-{номер}.md
   git commit -m "docs(tech-design): add tech design for task {номер}"
   ```
4. **Запушити гілку в репозиторій**:
   ```bash
   git push -u origin tech-design-{номер}
   ```
5. **Створити Pull Request**:
   - Перевірити наявність GitHub CLI:
     ```bash
     gh pr create --title "docs(tech-design): task {номер} - {Назва}" --body "Детальний техдизайн для задачі {номер} згідно ROADMAP.md. Див. файл tech-designs/tech-design-{номер}.md"
     ```
   - Якщо `gh` не встановлено або не авторизовано — надати користувачу пряме посилання для створення PR:
     `https://github.com/01eksandr0/sonora/pull/new/tech-design-{номер}`
     та підготувати текст заголовка і опису.
