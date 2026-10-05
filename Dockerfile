# syntax=docker/dockerfile:1

# =============================================================================
# The invariant this file exists to keep
# =============================================================================
#
#   THE PRODUCTION SERVER BUILDS NOTHING.
#
# GitHub Actions is the only place a Kogaion image is produced. Coolify *pulls*
# a finished artifact, pinned by digest. There is no build path here that a
# platform toggle can reactivate -- if a condition is missing, the deploy must
# STOP, not quietly move the build back onto the server.
#
# Corollary, and the reason the runner stage is shaped the way it is: no secret
# is ever an ARG. ARGs and ENVs live in the image history and are printed in
# clear by `docker history`, `docker image inspect` and `crane config`; and CI
# sends `provenance: mode=max`, which records resolved build arguments by name
# and value. Every secret is a Runtime variable on the container.
# See docs/ghcr-coolify/02-variabile-de-construit.md.

# -----------------------------------------------------------------------------
# base
# -----------------------------------------------------------------------------
# oven/bun:1 is Debian 13 (trixie), NOT alpine, and it has no curl, no wget and no
# busybox. That is why the healthcheck below is written in bun rather than with wget.
#
# It does ship a `node` on PATH, but that is a symlink to bun put there by the base
# image, not a Node runtime. A probe written as `node -e ...` would therefore start --
# and would be running bun while claiming to be node, which is exactly the kind of
# thing that breaks silently when the base image changes. `bun -e` says what it runs.
#
# Pinned to the exact version the project uses, so a rebuild on a different day is the
# same build; bun:1 floats.
FROM oven/bun:1.3.14 AS base
WORKDIR /code

# -----------------------------------------------------------------------------
# deps -- full install, for the build only
# -----------------------------------------------------------------------------
# Only the manifests are copied, so this layer is invalidated by a dependency
# change and nothing else. --ignore-scripts because the `prepare` script
# (svelte-kit sync) needs svelte.config.js, which is not in the context yet.
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# -----------------------------------------------------------------------------
# prod-deps -- runtime dependencies only
# -----------------------------------------------------------------------------
# This is the stage that decides the size of the deployed image. A full install is
# 456 MB; this is 246 MB.
#
# It is safe because Vite externalises ONLY packages from `dependencies` into
# build/server. Everything imported from src/ that lives in devDependencies
# (drizzle-orm, postgres, better-auth, bits-ui, sveltekit-superforms, @lucide/svelte,
# tailwind-merge, formsnap) is therefore BUNDLED into the server chunks and needs no
# node_modules entry at runtime.
#
# Measured on a real build, the bare specifiers left in build/server are 22, and every
# one resolves to a direct entry in `dependencies`:
#
#   sharp, marked, xlsx, isomorphic-dompurify,
#   @tiptap/core, @tiptap/pm, @tiptap/extensions, @tiptap/starter-kit, @tiptap/suggestion,
#   @tiptap/extension-{code-block-lowlight,highlight,image,list,subscript,superscript,
#                 table,text-align,text-style,typography},
#   @aarkue/tiptap-math-extension, tiptap-extension-auto-joiner
#
# plus node builtins. Note what is NOT there: drizzle-orm, postgres and better-auth are
# in devDependencies, and they are absent from that list precisely because they got
# bundled -- which is the assumption this stage rests on.
#
# That is a fact about this build, not a law, so CI re-derives it on every run: the
# `build` job lists the bare specifiers and fails if any is not a direct entry in
# `dependencies`. Move `marked` to devDependencies and the pipeline fails naming the
# package, instead of the container crash-looping on ERR_MODULE_NOT_FOUND in production.
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# -----------------------------------------------------------------------------
# builder
# -----------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /code
COPY . .

# NODE_ENV=production is not a preference. paraglide-js compiles translations in
# buildStart() and only THROWS on a broken message file when NODE_ENV is
# production; otherwise it logs and continues, which would ship an image with
# missing translations behind a green pipeline.
ENV NODE_ENV=production

# Runs `prepare` now that svelte.config.js exists in the context.
RUN bun install --frozen-lockfile

# No secrets here. `$env/dynamic/private` is read from process.env at RUNTIME,
# getAuth() is lazy, and initAuth() returns early while `building` -- so none of
# the application secrets have to exist during the build. The previous revision of
# this file passed BETTER_AUTH_SECRET and GOOGLE_CLIENT_SECRET as ARGs, which
# bought nothing and did put them in the image history; `docker build` warned about
# exactly that (SecretsUsedInArgOrEnv) and the warning was correct.
#
# DATABASE_URL is the one exception, and only as a decoy: ~35 route modules are
# evaluated during the module-graph analysis, and src/lib/server/db/index.ts falls
# back SILENTLY to postgres://localhost:5432/kogaion when the variable is absent. A
# fake value keeps that fallback out of reach. It is not a secret.
ENV DATABASE_URL=postgres://localhost:5432/kogaion

# GIT_SHA is deliberately NOT declared in this stage. It changes on every commit,
# and an ENV is part of the cache key of every layer after it -- declaring it here
# would invalidate the build step on every single push and turn the Docker layer
# cache into decoration, which is the exact trap the documentation records in
# docs/ghcr-coolify/09-portabilitate.md section 5.2. The value is needed by the
# RUNNING process, so it is applied in the runner stage, after the expensive
# layers are already cached.
#
# It is a plain ENV and not an ARG for a second reason: an ARG would accept a value
# from any caller, and the ARG shape is the one that eventually gets a secret.

# src/lib/paraglide/ is gitignored and regenerated by the paraglide Vite plugin in
# buildStart(), so a clean checkout builds without it.
RUN bun run build

# -----------------------------------------------------------------------------
# runner
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.14 AS runner
WORKDIR /code

# The account is written straight into /etc/passwd rather than created with useradd.
# useradd does exist in this base image, but a printf is deterministic and has no
# dependency on the base image's passwd package -- and what matters is the result, not
# which of the two ways produced it.
#
# USER takes a numeric uid, which means Docker never goes through su -- and so never
# checks /etc/shells, which matters because this entry names /sbin/nologin.
# Running non-root is not decoration: it is the first thing that limits what a
# compromised renderer can reach.
RUN printf '%s\n' 'app:x:1001:1001:app:/home/app:/sbin/nologin' >> /etc/passwd \
 && printf '%s\n' 'app:x:1001:' >> /etc/group \
 && mkdir -p /home/app /code \
 && chown -R 1001:1001 /home/app /code

# SHUTDOWN_TIMEOUT is adapter-node's drain window, and it is pinned here because the
# default disagrees with the platform. adapter-node waits 30s; Docker's own default
# grace period on stop is 10s. Left at the default, the drain gets SIGKILLed about two
# thirds of the way through and the graceful shutdown the CMD comment below promises is
# only ever partly true.
#
# 8s fits inside Docker's window and still lets in-flight requests finish. Coolify's
# Stop Grace Period (Advanced -> Operations, default 30) is above it, so the panel is
# not the binding constraint. Raise this only together with that setting, or the two
# will drift apart silently again. The comment sits here rather than inside the ENV
# continuation below, because a comment between backslash-continued lines is exactly
# the kind of thing that parses differently between builder versions.
ENV NODE_ENV=production \
    HOME=/home/app \
    HOST=0.0.0.0 \
    PORT=3000 \
    SHUTDOWN_TIMEOUT=8

# The commit this image was built from, baked in here rather than in the builder so
# that a value which changes on every push cannot invalidate the build layers. It is
# not a secret: CI publishes the same value in the run summary beside the digest, and
# /api/health reports it back, so a running container can be traced to the commit
# that produced it. That is the link that turns "the deploy went green" into "this
# commit is the one answering requests".
ARG GIT_SHA=
ENV GIT_SHA=${GIT_SHA}

# ORIGIN is deliberately NOT set here.
#
# adapter-node falls back to deriving the origin from request headers when ORIGIN
# is absent, and that fallback hardcodes the protocol to https. Behind an HTTP
# ingress the derived origin is wrong, and every POST / form action is then
# rejected with 403 and no visible error. So ORIGIN must be set -- but on the
# CONTAINER, in Coolify, where it belongs: it is a fact about one deployment, not a
# property of the image. If it is missing the process refuses to start, because
# initAuth() in src/hooks.server.ts checks it and throws by name. A crash-loop that
# names the missing variable is the intended failure; a silently wrong origin is not.

# The whole build/ tree is copied, not build/server/index.js: that file is 514
# bytes of re-exports and pulls in twelve chunks.
COPY --from=builder --chown=1001:1001 /code/build ./build
COPY --from=prod-deps --chown=1001:1001 /code/node_modules ./node_modules

# -----------------------------------------------------------------------------
# OCI metadata
# -----------------------------------------------------------------------------
# org.opencontainers.image.source is what links the GHCR package to the repository.
# Without it the package is orphaned in the registry, and its access rules are
# nothing anybody remembers setting.
ARG GIT_SHA=
ARG IMAGE_CREATED=
LABEL org.opencontainers.image.title='kogaionacademy.ro' \
      org.opencontainers.image.description='SvelteKit 2 + Svelte 5, adapter-node, runtime bun' \
      org.opencontainers.image.source='https://github.com/mirelconstantin/kogaionacademy.ro' \
      org.opencontainers.image.revision='${GIT_SHA}' \
      org.opencontainers.image.created='${IMAGE_CREATED}' \
      org.opencontainers.image.licenses='UNLICENSED'

# -----------------------------------------------------------------------------
# HEALTHCHECK
# -----------------------------------------------------------------------------
# Written in bun because bun is the only runtime in this image. A probe written as
# `node -e` -- which is what the SvelteKit docs show -- does not start here, and
# neither does `wget`. A panel healthcheck built on either would mark a perfectly
# healthy container unhealthy and roll the deployment back.
#
# It also means Coolify's own healthcheck setting must stay OFF: Coolify prefers the
# image's HEALTHCHECK, and a dashboard HTTP check runs inside a container that has
# no HTTP client to run it with.
#
# /api/health never touches the database and never throws. It proves the process is
# standing and names the commit that is running -- it does not prove Postgres answers.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER 1001:1001
EXPOSE 3000

# Exec form on purpose: the server becomes PID 1 and receives SIGTERM directly, so
# build/index.js runs its graceful shutdown (closeIdleConnections -> close ->
# closeAllConnections after SHUTDOWN_TIMEOUT). Via `bun run start` there would be an
# intermediate process, SIGTERM would go to it, and every rolling update would become
# a hard kill in the middle of a request.
CMD ["bun", "./build/index.js"]
