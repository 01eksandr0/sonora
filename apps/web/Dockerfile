# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile --filter @music-app/web...
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
# vite build only: type-checking runs in CI and needs too much RAM for a 1 GB server
RUN pnpm --filter @music-app/shared-types build \
 && pnpm --filter @music-app/api-client build \
 && pnpm --filter @music-app/web exec vite build

FROM caddy:2-alpine
COPY --from=build /repo/apps/web/dist /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile
