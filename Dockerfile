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
# SvelteKit evaluates the server hooks during `vite build`, so these must be *set*, but they
# must never be *real* at build time: `.env` is excluded by .dockerignore and the build stage
# only needs the module graph to evaluate. Every ARG therefore carries a build-time default,
# so the build succeeds even when the platform passes only `--build-arg GIT_SHA=...`.
# The runtime values come from the container environment in the `runner` stage.
ARG DATABASE_URL=postgres://localhost:5432/kogaion
ARG ORIGIN=http://localhost:3000
ARG PUBLIC_SITE_URL=http://localhost:3000
ARG BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ARG GOOGLE_CLIENT_ID=
ARG GOOGLE_CLIENT_SECRET=
ARG GIT_SHA=

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
