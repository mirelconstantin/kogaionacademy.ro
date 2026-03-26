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

# Easypanel --build-arg does not become process.env unless declared here.
# SvelteKit / Better Auth evaluate auth and DB during `vite build`.
ARG DATABASE_URL
ARG ORIGIN
ARG PUBLIC_SITE_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GIT_SHA

ENV DATABASE_URL=${DATABASE_URL} \
	ORIGIN=${ORIGIN} \
	PUBLIC_SITE_URL=${PUBLIC_SITE_URL} \
	BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
	GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
	GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
	GIT_SHA=${GIT_SHA} \
	BETTER_AUTH_URL=${ORIGIN}

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
