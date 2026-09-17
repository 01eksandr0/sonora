# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile --filter @music-app/api...

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @music-app/shared-types build \
 && pnpm --filter @music-app/api prisma:generate \
 && pnpm --filter @music-app/api build \
 && pnpm --filter @music-app/api deploy --prod /out

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
