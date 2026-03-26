# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /code

# Cache deps: no project files yet, so skip lifecycle scripts (prepare needs svelte.config etc.)
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /code
COPY --from=deps /code/node_modules ./node_modules
COPY . .
RUN bun install --frozen-lockfile
ENV NODE_ENV=production
RUN bun run build

FROM base AS runner
WORKDIR /code

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /code/build ./build
COPY --from=builder /code/package.json ./
COPY --from=builder /code/bun.lock* ./
COPY --from=builder /code/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "start"]
