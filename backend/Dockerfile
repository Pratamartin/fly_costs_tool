FROM node:24-alpine AS base

FROM base AS builder

ENV DATABASE_URL="dummy-url"

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package*json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm ci

ENV NODE_ENV=production

RUN npm run build && \
    npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/
COPY --from=builder --chown=hono:nodejs /app/prisma /app/prisma
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3001

ENTRYPOINT ["node", "src/index.js"]