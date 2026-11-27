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
 && DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter @music-app/api prisma:generate \
 && pnpm --filter @music-app/api build \
 && pnpm --filter @music-app/api deploy --prod /out

# one-shot: applies Prisma migrations (prisma CLI is a devDependency, so it lives here, not in runtime)
FROM build AS migrate
WORKDIR /repo/apps/api
CMD ["pnpm", "prisma:deploy"]

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
