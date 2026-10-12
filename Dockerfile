ARG BUN_IMAGE=oven/bun:1-alpine

FROM ${BUN_IMAGE} AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM ${BUN_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM ${BUN_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nuxtjs -u 1001

COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/public ./public

USER nuxtjs

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
