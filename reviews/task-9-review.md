# Task 9 — Auto-Review

**Гілка:** `task-9` (незакомічені зміни)  
**Дата:** 2026-11-22  
**Глибина:** поверхнева (`/code-review low` + ручний прохід по player/library). Міграцію та стилі не перевіряли.  
**Техдизайн:** [tech-design-9.md](../tech-designs/tech-design-9.md)

## 🔴 Критично

Не знайдено.

## 🟠 Потрібно виправити

> ✅ Усі три пункти виправлені 2026-11-22: `PaginationQueryDto` для обраного; `previewUrl` більше не зберігається й не віддається в `FavoriteTrackSummary`; фронт шле `started` / `listened_10s` / `skipped` / `completed` з реальною тривалістю, бекенд веде один рядок `ListeningHistory` на прослуховування (`next()` окремо не пише, щоб не дублювати).

1. **`GET /library/favorites/tracks`: `limit`/`offset` без валідації** — [library.controller.ts](../apps/api/src/modules/library/library.controller.ts) читає їх через `@Query('limit')` без DTO.
   `?limit=abc` → `NaN` → помилка Prisma → 500; `?limit=100000` нічим не обмежений.
   Фікс: використати наявний `PaginationQueryDto` з `catalog/dto`.

2. **`FavoriteTrack.previewUrl` зберігається в БД назавжди** — [library.service.ts](../apps/api/src/modules/library/library.service.ts).
   Preview URL Deezer підписаний і живе ~15 хв (`hdnea=exp=…`); ONBOARDING прямо каже, що це не постійний asset. Програвання з «Обраного» зламається.
   Фікс: не покладатися на збережений URL, а брати свіжий через `catalogService.getFreshTrack` при запуску (як уже зроблено в `PlayerService`).

3. **Події життєвого циклу не відповідають техдизайну (§1.4.6, §3.4)**:
   - фронт шле тільки `completed`; `started`, `listened_10s`, `skipped` не відправляються ніколи;
   - `PlayerService.next()` не пише подію в `ListeningHistory`, хоча техдизайн цього вимагає;
   - `completed` завжди з `durationSec: 30` ([player.store.ts](../apps/web/src/features/player/model/player.store.ts), обробник `ended`), а не з реальною тривалістю `audio.duration`.

   Наслідок: Listening History і майбутні рекомендації отримують неповні дані.

## 🟡 Можна виправити пізніше

1. **Гонки read-modify-write сесії в Redis** — `PlayerService` читає стан, змінює і перезаписує без блокування. Швидкі `next`/`seek` від одного користувача можуть затерти один одного.
2. **`progressMs` на бекенді оновлюється тільки при `seek`** — логіка `previous` (>3 с) на сервері спирається на застарілий прогрес. Зараз це маскує фронт (сам робить `seek(0)`), але сервер сам по собі неправильний.
3. **Fallback черги для упорядкованих контекстів** (`collection`/`album`/`playlist`) після вичерпання колекції не фільтрує треки по історії — можливі повтори.
4. **`GET /library/favorites/tracks/status?ids=`** — кількість id не обмежена.
5. **Кеш каталогу (search 1 год, track/top-tracks 24 год) містить `previewUrl`**, що живе 15 хв. Плеєр це обходить, але будь-яке інше місце, яке програє превʼю з кешу, отримає 403.
6. **Помилка відтворення не показується користувачеві** — при 403/мережевій помилці плеєр просто зупиняється (є тільки одна спроба зі свіжим URL).

## 🟢 Рекомендації

1. `AppLayout`: `isProfile` перевіряє і `route.name`, і `route.path.endsWith('/profile')` — достатньо імені роуту.
2. Тест `player.service.spec.ts` покриває сервіс, але `PlayerQueueService` і `LibraryService` без тестів.

## Вже виправлено в цій гілці під час рев'ю

- Старий стан сесії перетирав щойно запущений трек (`initFromBackend` у `MusicPlayer.onMounted`).
- Трек перезапускався після відповіді `/player/play` через різні підписані URL.
- Гонки відповідей при швидких кліках / next / previous (`switchSeq`).
- `next` не грав: протухлий `previewUrl` у черзі → тепер свіжий URL для поточного треку.
- Колекція «This week for you» йшла не по порядку через дедуплікацію по історії.
