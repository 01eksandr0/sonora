# docker/

Додаткові Docker-файли для інфраструктури (init-скрипти Postgres, конфіги Redis тощо).

Production Dockerfile для API знаходиться в `apps/api/Dockerfile`.
Локальна інфраструктура піднімається кореневим `docker-compose.yml`:

```bash
pnpm infra:up
```
