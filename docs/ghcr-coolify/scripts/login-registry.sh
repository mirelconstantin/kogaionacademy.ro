#!/usr/bin/env bash
#
# login-registry.sh -- prove that THIS machine can authenticate to GHCR and pull
# the Kogaion image.
#
# Run it on the deploy host, over SSH, as the exact user the panel runs Docker
# as. Coolify never logs in on your behalf: deploying a "Docker Image" resource
# makes it shell out to the docker CLI on the server, and that CLI reads
# credentials from the HOME directory of the user who owns the process. Pick the
# wrong user and the pull is anonymous, which fails with
#
#     error from registry: unauthorized
#
# even when the token is perfectly valid. The right user is one click away in the
# panel: Servers -> your server -> General -> SSH user.
#
# Five separate things are proven here, because each one fails differently and
# each failure has a different fix:
#
#   1. the docker CLI exists and the daemon answers -> this is a host with a
#      working Docker, not a container with no mounted socket;
#   2. "docker login" is accepted -> GHCR accepted these credentials;
#   3. the credential file exists, in the HOME the panel will use, and has an
#      entry for ghcr.io -> the pull will not be anonymous;
#   4. the registry v2 API answers 200 on the package tag list -> the token
#      really carries read:packages AND really can see this package.
#      This is the step people skip, and it is the one that catches the two
#      failures which masquerade as "the image was never built": a fine-grained
#      PAT (it has no Packages scope at all, so it cannot pull anything) and a
#      token whose account cannot see the package (the registry answers 404,
#      which reads exactly like a missing tag);
#   5. the manifest for the target reference resolves -> this exact tag is
#      pullable by this exact account, and its digest can be printed.
#
# One caveat that changes what a green result MEANS, so it is worth reading
# before reading the summary: the GitHub repository being public says nothing
# about the GHCR package. A package is public or private according to how it
# was created at the first push, and a PUBLIC package answers 200 and
# resolves its manifest to anybody, authenticated or not. So on a public
# package checks 4 and 5 prove that the registry is reachable, NOT that the
# token is good; on a private package they are the proof, and the
# "docker login" in step 2 is not optional. The script says so out loud at the
# point where it matters instead of leaving a false all-clear behind.
#
# Step 5 is what an operator actually wants out of this script. CI pins the
# Coolify resource to a SHA256 digest, so the digest is the only reliable way to
# say "this server can reach precisely the build that shipped". It is printed in
# both forms the tooling uses, because the two differ and confusing them wastes
# an afternoon:
#
#   sha256-<hex>        what Coolify stores in docker_registry_image_tag
#                       (hyphen, no colon -- that is not a typo, it is Coolify)
#   image@sha256:<hex>  what Coolify writes into the compose file it generates
#                       (colon, after an @, this is the standard Docker form)
#
# Usage:
#   # on the deploy host, as the Coolify SSH user. This project has a single
#   # branch, so TAG defaults to 'main' and the ordinary case omits it.
#   REGISTRY_USERNAME=mirelconstantin REGISTRY_TOKEN=ghp_xxxxxxxx \
#     bash login-registry.sh
#
#   # resolve one commit-pinned tag and copy the digest into the other two scripts
#   REGISTRY_USERNAME=mirelconstantin REGISTRY_TOKEN=ghp_xxxxxxxx \
#   TAG=sha-9f1c0b2d4e5a6f7089abcdef0123456789abcdef \
#     bash login-registry.sh
#
# Requires: docker and curl. Installs nothing. The only file it writes is
# ~/.docker/config.json (or $DOCKER_CONFIG/config.json), which is the point.
#
# NOTE ON SECRETS: tracing is deliberately never switched on anywhere in this
# file, and the token reaches docker and curl through stdin or through a pipe,
# never through argv. On a shared server "ps aux" is readable by every user, so
# a PAT that appears in a process listing is a PAT that ends up in process
# monitors, in anything that scrapes ps, and in the history of any shell that
# echoes its commands.
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration. Only IMAGE and TAG are optional; both defaults are this
# project's real values, so the ordinary case is two variables and nothing else.
# There is a single branch, so 'main' is the one moving tag CI publishes and the
# one the single Docker Image resource deploys.
# ---------------------------------------------------------------------------

IMAGE="${IMAGE:-ghcr.io/mirelconstantin/kogaionacademy.ro}"
TAG="${TAG:-main}"

# GHCR is not configurable on purpose. The whole point of this repository is that
# the image lives in the GitHub Container Registry, and a configurable registry
# here would turn a typo into a confusing 404 instead of an obvious mistake.
REGISTRY_HOST='ghcr.io'
REGISTRY_API="https://${REGISTRY_HOST}"

# The media types a manifest may legitimately be served as. A HEAD that
# advertises only the single-image v2 media type answers 404 for an image
# published as a multi-platform OCI index, and that 404 is indistinguishable from
# "no such tag". Advertising all of them is what the docker CLI itself does when
# it resolves a reference.
MANIFEST_ACCEPT='application/vnd.oci.image.index.v1+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json'

# Summary accumulator. A plain string instead of an array so the script does not
# depend on bash 4.4 array semantics under "set -u": on older bash expanding an
# empty array is an unbound-variable error, which would abort the one part that
# must always run, namely the closing summary.
SUMMARY=''
PASSED=0
FAILED=0

# ---------------------------------------------------------------------------
# Required environment. Both variables are reported together rather than one at
# a time, because the normal way this script is run is by copying the two
# variable invocation out of the header above and forgetting one of them. Each
# name is printed exactly as it must be exported into the environment.
# ---------------------------------------------------------------------------

missing=''
[ -n "${REGISTRY_USERNAME-}" ] || missing="${missing}REGISTRY_USERNAME "
[ -n "${REGISTRY_TOKEN-}" ] || missing="${missing}REGISTRY_TOKEN "

if [ -n "$missing" ]; then
  printf 'ERROR: required environment variable(s) are not set: %s\n' "$missing" >&2
  printf '\nWhat to do next:\n' >&2
  printf '  1. Create a CLASSIC personal access token at\n' >&2
  printf '       https://github.com/settings/tokens/new\n' >&2
  printf '     -- no ?type=fine-grained -- with scope read:packages. Fine-grained\n' >&2
  printf '     tokens have no Packages permission and can never pull a private\n' >&2
  printf '     package, whatever they are granted elsewhere.\n' >&2
  printf '  2. Export BOTH variables in a single command:\n' >&2
  printf '       REGISTRY_USERNAME=mirelconstantin REGISTRY_TOKEN=ghp_xxxxxxxx \\\n' >&2
  printf '         bash %s\n' "$0" >&2
  printf '     REGISTRY_USERNAME is the GitHub account that OWNS the token, which\n' >&2
  printf '     is not necessarily the owner of the package.\n' >&2
  printf '  3. Run this over SSH as the user Coolify SSHes as -- panel: Servers ->\n' >&2
  printf '     your server -> General -> SSH user -- and not as root, unless the\n' >&2
  printf '     panel really is configured to use root.\n' >&2
  exit 2
fi

# The token is handed to curl as a config document of the form
# "user = name:token". A double quote or a backslash in the token would produce
# a silently malformed request and a baffling 400 from the registry, so reject it
# here with a clear message instead. Real GHCR PATs are [A-Za-z0-9_] only.
case "$REGISTRY_TOKEN" in
  *'"'*|*'\'*)
    echo 'ERROR: REGISTRY_TOKEN contains a double quote or a backslash, which cannot be' >&2
    echo '       passed safely to curl. Copy the token again straight from GitHub;' >&2
    echo '       do not paste it through a shell that escapes characters.' >&2
    exit 2
    ;;
esac

# ---------------------------------------------------------------------------
# Input normalisation and validation.
# ---------------------------------------------------------------------------

# Strip the registry host to get the namespace/repository path the v2 API
# expects. Done in two steps rather than one nested expansion so that the pattern
# being stripped stays obvious.
REPO_PATH="$IMAGE"
REPO_PATH="${REPO_PATH#${REGISTRY_HOST}/}"

if [ "$REPO_PATH" = "$IMAGE" ]; then
  echo "ERROR: IMAGE must live under $REGISTRY_HOST." >&2
  printf '  You passed: %s\n' "$IMAGE" >&2
  printf '  Expected:   %s/OWNER/REPO\n' "$REGISTRY_HOST" >&2
  printf '               (for example ghcr.io/mirelconstantin/kogaionacademy.ro)\n' >&2
  printf '  A GHCR image is always addressed as ghcr.io/<owner>/<repo>, never as\n' >&2
  printf '  github.com/<owner>/<repo>.github and never as a bare owner/repo.\n' >&2
  exit 2
fi

case "$REPO_PATH" in
  */*) : ;;
  *)
    echo 'ERROR: IMAGE is missing the repository part.' >&2
    printf '  You passed: %s\n' "$IMAGE" >&2
    printf '  Expected:   %s/OWNER/REPO, where OWNER is the GitHub user or org.\n' "$REGISTRY_HOST" >&2
    printf '  Check the image name against the one in .github/workflows/ci.yml.\n' >&2
    exit 2
    ;;
esac

# A tag must be a single path-safe token. Whitespace means the invocation was
# mangled by a copy/paste, and a stray "@" means someone passed a digest where a
# tag is expected (rollback.sh is the script for digests).
case "$TAG" in
  ''|*[[:space:]]*|*'@'*)
    echo 'ERROR: TAG is not a usable tag name.' >&2
    printf '  You passed: [%s]\n' "$TAG" >&2
    printf '  A tag is one word, no spaces, no "@". The valid values for this project:\n' >&2
    printf '    main                               the moving tag CI publishes on push\n' >&2
    printf '    sha-<full 40 character commit sha>  the commit-pinned tag CI publishes\n' >&2
    printf '  To work with a digest, use rollback.sh with ROLLBACK_TO=... instead.\n' >&2
    exit 2
    ;;
esac

REF="$IMAGE:$TAG"

# ---------------------------------------------------------------------------
# Scratch space. HTTP bodies and headers go to files rather than into shell
# variables, so a multi-kilobyte manifest can never trip the "ignored null byte"
# warning some shells emit on command substitution, and so a body can still be
# inspected afterwards when something goes wrong.
# ---------------------------------------------------------------------------

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

HDR_FILE="$WORK_DIR/headers.txt"
BODY_FILE="$WORK_DIR/body.json"
MANIFEST_FILE="$WORK_DIR/manifest.json"
VERBOSE_FILE="$WORK_DIR/manifest-verbose.json"

# ---------------------------------------------------------------------------
# Output helpers.
# ---------------------------------------------------------------------------

say()  { printf '\n== %s ==\n' "$*"; }
note() { printf '   ..    %s\n' "$*"; }

# Every check is printed as it happens AND recorded, because the closing summary
# has to be a checklist and not a single verdict line. During an incident the
# question is "which of these five is broken", and each one has its own fix.
record() {
  SUMMARY="${SUMMARY}  ${1}  ${2}\n"
  if [ "$1" = 'PASS' ]; then
    PASSED=$(( PASSED + 1 ))
  else
    FAILED=$(( FAILED + 1 ))
  fi
}

pass() { record PASS "$1"; printf '   OK    %s\n' "$1"; }
fail() { record FAIL "$1"; printf '   FAIL  %s\n' "$1" >&2; }

print_summary() {
  local verdict
  if [ "$FAILED" -eq 0 ]; then
    verdict='PASS'
  else
    verdict='FAIL'
  fi
  printf '\n== summary ==\n'
  printf '%b' "$SUMMARY"
  printf '   RESULT: %s (%s of %s checks passed)\n' "$verdict" "$PASSED" "$(( PASSED + FAILED ))"
}

# die <what failed> <what to do next>
#
# The second argument is mandatory by design. A message that only says what
# failed assumes the reader already knows the fix, which is exactly the state
# nobody is in while running a deploy script at midnight.
die() {
  fail "$1"
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  %s\n' "$2" >&2
  print_summary
  exit 1
}

# ---------------------------------------------------------------------------
# HTTP helpers.
#
# curl is driven with its request description on stdin (--config -) instead of
# on the command line. The reason is not tidiness: on a shared host "ps aux" is
# readable by every user, and a PAT in argv is a PAT that ends up in process
# monitors, in anything that scrapes ps, and in the history of any shell that
# echoes its commands. "docker login --password-stdin" gets this right by
# construction; these calls get it right the same way.
# ---------------------------------------------------------------------------

# Authenticate with the PAT itself. Only the token endpoint accepts Basic auth.
registry_token_request() {
  # $1 = full url of the token endpoint.
  printf 'user = "%s:%s"\nurl = "%s"\n' \
    "$REGISTRY_USERNAME" "$REGISTRY_TOKEN" "$1" \
    | curl --silent --show-error --location --config -
}

# Call the v2 API with a bearer token. Writes response headers to HDR_FILE and
# the body to BODY_FILE; prints the HTTP status code.
v2_get() {
  # $1 = url, $2 = bearer token.
  printf 'header = "Authorization: Bearer %s"\nurl = "%s"\n' "$2" "$1" \
    | curl --silent --show-error --location \
           --dump-header "$HDR_FILE" \
           --output "$BODY_FILE" \
           --write-out '%{http_code}' \
           --config -
}

# A HEAD against the manifest endpoint with the right Accept header. Prints the
# HTTP status code and writes headers to HDR_FILE; the body is discarded because
# a manifest can be hundreds of kilobytes of JSON.
v2_head_manifest() {
  # $1 = url, $2 = bearer token.
  printf 'header = "Authorization: Bearer %s"\nheader = "Accept: %s"\nurl = "%s"\n' \
    "$2" "$MANIFEST_ACCEPT" "$1" \
    | curl --silent --show-error --location --head \
           --dump-header "$HDR_FILE" \
           --output /dev/null \
           --write-out '%{http_code}' \
           --config -
}

# Pull the Docker-Content-Digest response header. The header can appear once per
# redirect hop, so the LAST one wins: that is the digest of the final manifest,
# which is the only one that matters. tolower() instead of IGNORECASE because
# IGNORECASE is a GNU awk extension that busybox awk does not have.
header_digest() {
  awk '
    { gsub(/\r/, "") }
    tolower($1) == "docker-content-digest:" { found = $2 }
    END { print found }
  ' "$HDR_FILE"
}

# Ask the token endpoint for a short-lived pull token.
#
# GHCR, like every registry implementing the distribution specification, does not
# accept Basic auth on /v2/. It answers 401 with a WWW-Authenticate header naming
# the token service, and the client must exchange its credentials for a
# short-lived bearer token first. "docker login" does that internally and hides
# the token in ~/.docker/config.json; when we call the API ourselves we have to
# do it explicitly, which is why this helper exists.
acquire_pull_token() {
  # $1 = scope, for example "repository:mirelconstantin/kogaionacademy.ro:pull".
  local url response token
  url="${REGISTRY_API}/token?service=${REGISTRY_HOST}&scope=${1}"
  if ! response="$(registry_token_request "$url")"; then
    return 1
  fi
  # The response is a small flat JSON object. Parsing it with sed rather than jq
  # is deliberate: jq is not installed on a minimal deploy host, and adding a
  # dependency to a diagnostic script is how that script stops being runnable
  # precisely when it is needed.
  token="$(printf '%s' "$response" | tr -d '\n' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
  [ -n "$token" ] || return 1
  printf '%s' "$token"
}

# Print at most N lines of stdin. awk "NR<=n" rather than "head -n n": head
# closes the pipe early, the writer dies on SIGPIPE, and "set -o pipefail"
# correctly reports that as failure 141, which would abort the script in the
# middle of printing a success message.
first_n() {
  awk -v n="$1" 'NR <= n'
}

# ===========================================================================
say '0. what is being authenticated, and as whom'
# ===========================================================================

note "user          $(id -un)  (uid $(id -u))"
note "home          $HOME"
note "image         $IMAGE"
note "tag           $TAG"
note "full ref      $REF"
note "package path  $REPO_PATH"
note ''

note 'WARNING: the GitHub repository is public, but the GHCR PACKAGE is a'
note '         separate object with its own visibility, and this script cannot'
note '         see it: a package inherits public or private visibility from how'
note '         it was created at the FIRST push. Nothing in the deploy rewrites'
note '         it later -- changing it is a settings click on the package page.'
note '         If the package is PRIVATE, the "docker login" in step 2 is'
note '         mandatory: without a stored credential every pull is anonymous'
note '         and fails with "error from registry: unauthorized".'
note '         If the package is PUBLIC, that credential is never exercised by a'
note '         real pull, which is why steps 4 and 5 below say what they prove.'
note '         Tell the two apart rather than guessing: docker manifest inspect'
note "         $REF  --  a 401 there means PRIVATE."
note ''

if [ "$(id -u)" -eq 0 ]; then
  note 'WARNING: running as root. Docker credentials are written to'
  note '         /root/.docker/config.json. If the panel SSHes as a different'
  note '         user, the deploy pull is still anonymous. Confirm the SSH user'
  note '         in the panel -- Servers -> server -> General -- and re-run this'
  note '         script as THAT user.'
  note ''
fi

# ===========================================================================
say '1. is there a working Docker here'
# ===========================================================================

if ! command -v docker >/dev/null 2>&1; then
  die 'the docker CLI is not on PATH' \
    'Install Docker on this host (panel: Servers -> your server -> General -> Install Docker), or re-run this script on the machine that actually runs the containers.'
fi
pass "docker CLI found at $(command -v docker)"

# The CLI being on PATH does not mean the daemon is reachable. The common
# failure on a fresh host is a shell inside a container with no
# /var/run/docker.sock mounted, where "docker login" fails with a permission
# error that looks exactly like a credential problem.
if ! docker info >/dev/null 2>&1; then
  die 'the docker CLI is installed but the daemon did not answer "docker info"' \
    'Either Docker is not running on this host (systemctl status docker), or this shell is inside a container without /var/run/docker.sock mounted. Run the script directly on the host, not from inside a container.'
fi
pass 'the docker daemon is reachable and this user can talk to it'

# ===========================================================================
say '2. authenticating to ghcr.io'
# ===========================================================================

# --password-stdin, never --password: the token travels through a pipe, so it is
# never in the process listing, never in the shell history, and never in the
# "docker login" line somebody pastes into a ticket.
if ! printf '%s' "$REGISTRY_TOKEN" \
     | docker login "$REGISTRY_HOST" --username "$REGISTRY_USERNAME" --password-stdin >/dev/null 2>&1; then
  die "docker login was rejected for user '$REGISTRY_USERNAME'" \
    'GHCR refused these credentials. Check, in this order: (1) REGISTRY_TOKEN is a CLASSIC PAT from https://github.com/settings/tokens/new and not a fine-grained one; (2) it has not expired -- GitHub PATs do not warn you, they simply stop working; (3) REGISTRY_USERNAME is the account that OWNS the token, which need not be the owner of the package; (4) the token was copied whole, with no missing or extra character.'
fi
pass "docker login accepted the credentials for user $REGISTRY_USERNAME"

# ===========================================================================
say '3. did the credential land where the panel will look for it'
# ===========================================================================

# Docker reads credentials from $DOCKER_CONFIG/config.json when that variable is
# set and from ~/.docker/config.json when it is not. Both arrangements exist in
# the wild, and a shell with DOCKER_CONFIG exported will happily write to one
# file while the panel reads the other -- the single most common cause of an
# "unauthorized" deploy that a perfectly correct token cannot fix.
DOCKER_CONFIG_STATE="${DOCKER_CONFIG:-<unset>}"
if [ -n "${DOCKER_CONFIG-}" ]; then
  CONFIG_PATH="$DOCKER_CONFIG/config.json"
  note 'DOCKER_CONFIG is set, so the docker CLI will read this file:'
else
  CONFIG_PATH="$HOME/.docker/config.json"
fi

if [ ! -f "$CONFIG_PATH" ]; then
  die "no credential file at $CONFIG_PATH" \
    "docker login reported success but wrote nothing where the docker CLI looks. Check that DOCKER_CONFIG is not pointing somewhere unexpected (currently $DOCKER_CONFIG_STATE), that HOME is what you expect it to be, and that the filesystem is writable. The panel reads this same file when it pulls, so a credential stored anywhere else is a credential the deploy will not use."
fi

# The PATH is printed; the file is never printed. An operator under pressure
# will otherwise "just cat it" to check the credential, and it goes into their
# terminal scrollback, their screen share and their ticket.
pass "credential file present: $CONFIG_PATH (contents deliberately not printed)"

# Confirm the file actually has an entry for this registry, without disclosing
# the credential inside it.
if grep -q "\"${REGISTRY_HOST}\"" "$CONFIG_PATH"; then
  pass "the credential file has an entry for $REGISTRY_HOST"
elif grep -q '"credsStore"\|"credHelpers"' "$CONFIG_PATH"; then
  note "no per-registry key for $REGISTRY_HOST, but a credential helper is configured."
  note 'That is fine: the helper owns the credential and the docker CLI will ask'
  note 'it. The registry API check below is what actually proves the token works,'
  note 'so if that passes, this is not a problem.'
else
  die "the credential file exists but has no entry for $REGISTRY_HOST" \
    "docker login wrote the credential somewhere else, or something removed it afterwards. Delete $CONFIG_PATH, re-run this script, and look for a cleanup cron job or a stray 'docker logout' in a profile script. An existing file with no $REGISTRY_HOST entry means every pull will be anonymous."
fi

# ===========================================================================
say '4. does the token really carry read:packages'
# ===========================================================================

# The bare /v2/ ping only proves the registry is up. The tag list for THIS
# package proves the token can see THIS package, which is a strictly stronger
# and far more useful claim: it is the difference between "the token works" and
# "the token works for the thing being deployed".
TOKEN="$(acquire_pull_token "repository:${REPO_PATH}:pull")" || TOKEN=''
if [ -z "$TOKEN" ]; then
  die 'the registry token endpoint returned no usable token' \
    "The exchange of your PAT for a short-lived pull token failed, which almost always means GHCR rejected the credentials outright. Re-check that REGISTRY_TOKEN is a CLASSIC PAT with scope read:packages and has not expired, then re-run. Test the credential in isolation with: curl -sS -u your_user:your_token 'https://ghcr.io/token?service=ghcr.io&scope=repository:${REPO_PATH}:pull'"
fi
pass "obtained a short-lived pull token for repository:${REPO_PATH}"

http_code="$(v2_get "${REGISTRY_API}/v2/${REPO_PATH}/tags/list" "$TOKEN")" || http_code='000'

case "$http_code" in
  200)
    pass 'the v2 tag list answered 200: this token can read this package'
    note ''
    note 'READ THIS BEFORE TRUSTING THAT PASS. The repository is public, but the'
    note 'package may be public or private independently of it, and a PUBLIC'
    note 'package lists its tags to anybody, with no credentials at all. So this'
    note '200 does NOT prove the token can read THIS package -- it proves the'
    note 'registry answered. The PAT itself was already validated one step'
    note 'earlier, by the token exchange that had to succeed to get here; what a'
    note 'public package adds is that read:packages was never really exercised,'
    note 'so do not read this green line as "everything is fine". FOR A PRIVATE'
    note 'PACKAGE this is the check that carries the proof. Confirm which of the'
    note 'two you have with "docker manifest inspect <ref>" (401 = private).'
    ;;
  401|403)
    die "the v2 tag list answered $http_code: the token cannot read this package" \
      'The credentials are valid but not authorized for it. Check that the token has scope read:packages, that REGISTRY_USERNAME is the account that OWNS the token, and that the account can actually see the package. Note that a package your account cannot see answers 404 rather than 403, to avoid confirming that it exists.'
    ;;
  404)
    die 'the v2 tag list answered 404: the package path does not exist, or is not visible' \
      "Check IMAGE for typos against the image name in .github/workflows/ci.yml (expected $IMAGE:$TAG). A private package your account cannot see answers 404 as well, so if the name is right the fix is access: grant the token's account access to the package, or publish the image to a package that account can read."
    ;;
  000)
    die 'the registry could not be reached at all' \
      "No HTTP response from $REGISTRY_API. Check outbound connectivity and DNS from this host: a bare request to https://ghcr.io/v2/ should answer 401 when the registry is reachable and unauthenticated. A proxy, or an egress firewall that blocks ghcr.io, produces exactly this."
    ;;
  *)
    die "the v2 tag list answered an unexpected status: $http_code" \
      "The registry is reachable but did not behave like a registry. Re-run with verbose output to see the body, and note that a 5xx here is a registry-side problem: retry in a minute before changing anything."
    ;;
esac

# Give the operator a sense of the package's shape without dumping every tag of a
# project that have hundreds of them.
#
# The "|| true" on both pipelines is load bearing. grep exits 1 when it matches
# nothing, pipefail propagates that as a failed pipeline, and a failed command
# substitution under "set -e" kills the script outright. A brand new package
# legitimately has zero sha- tags, and a diagnostic script has to survive that
# and report zero rather than die on it.
tag_total="$(grep -o '"' "$BODY_FILE" | wc -l | tr -d ' ' || true)"
tag_total="${( tag_total / 2 )}"
tag_sha="$(grep -o '"sha-' "$BODY_FILE" | wc -l | tr -d ' ' || true)"
note "tags published: $tag_total in total, $tag_sha of them commit-pinned sha- tags"
  note 'commit-pinned is a CI CONVENTION, not a registry guarantee: GHCR has no
        immutable-tag feature and anything with packages:write can overwrite one.'
note 'a sample (lexicographic order, which is NOT chronological -- read the real'
note 'order off the Actions tab, or with: gh run list --repo mirelconstantin/kogaionacademy.ro):'
tr ',' '\n' < "$BODY_FILE" \
  | sed -e 's/[][{}"]//g' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
  | grep -v -e '^$' -e '^tags$' \
  | first_n 12 \
  | sed 's/^/       /'
if [ "$tag_sha" -gt 0 ]; then
  note 'a commit-pinned sha- tag per commit is what makes a rollback a field edit;'
  note 'without one, rolling back means rebuilding, which is what this setup avoids.'
fi

# ===========================================================================
say '5. does the target reference resolve, and what is its digest'
# ===========================================================================

# Proof through the docker CLI's own credential path, using the config.json that
# was just written. This is deliberately redundant with the registry API call
# below: the API call proves the TOKEN, this one proves the CREDENTIAL FILE, and
# they fail independently. A token can be perfect while the file sits in the
# wrong HOME, which is the exact failure this whole script exists to catch.
if docker manifest inspect "$REF" >"$MANIFEST_FILE" 2>/dev/null; then
  pass "docker manifest inspect resolved $REF using the stored credential"
else
  die "docker could not resolve $REF even though the registry API accepts this token" \
    "The token works but the docker CLI is not finding it, which means the credential file is not where the CLI looks. Check DOCKER_CONFIG (currently $DOCKER_CONFIG_STATE) and confirm you ran this script as the user the panel SSHes as. Re-running as that user normally fixes it."
fi

# The authoritative digest. For a multi-platform image the digest of the INDEX is
# what CI publishes and what Coolify pins; the per-platform manifest digests
# inside it are different values and are not interchangeable with it.
digest=''
http_code="$(v2_head_manifest "${REGISTRY_API}/v2/${REPO_PATH}/manifests/${TAG}" "$TOKEN")" || http_code='000'
digest="$(header_digest)"

# Some registries refuse HEAD on the manifest endpoint. Retry with a GET before
# declaring failure, because "no digest" and "wrong media type" look identical
# from the outside.
if [ -z "$digest" ]; then
  note "no digest from HEAD (status $http_code); retrying with GET"
  http_code="$(v2_get "${REGISTRY_API}/v2/${REPO_PATH}/manifests/${TAG}" "$TOKEN")" || http_code='000'
  digest="$(header_digest)"
fi

case "$digest" in
  sha256:????????????????????????????????????????????????????????????????)
    pass 'resolved the manifest digest from the registry'
    ;;
  '')
    die "the registry did not return a digest for $REF (status $http_code)" \
      "The tag list was readable but this specific tag is not. Confirm it exists by reading the sample printed in step 4, and remember that CI publishes two kinds of tag: the moving branch name (main, the only branch this project has) and the immutable sha-<full 40 character commit>. A moving tag only exists for branches that have been built at least once, and it points at whatever that branch's LAST successful run pushed."
    ;;
  *)
    die "the registry returned an unexpected digest value: $digest" \
      'This is not a sha256 digest. Re-run to confirm, and check for a reverse proxy in front of this host that rewrites response headers.'
    ;;
esac

# The platform-level refs are informational only. They are NOT the digest Coolify
# pins, and printing them right next to the index digest is exactly how somebody
# ends up pasting the wrong value into the panel.
if docker manifest inspect --verbose "$REF" >"$VERBOSE_FILE" 2>/dev/null; then
  platform_refs="$(sed -n 's/.*"Ref":"\([^"]*\)".*/\1/p' "$VERBOSE_FILE" | first_n 6)"
  if [ -n "$platform_refs" ]; then
    note 'platform manifests inside that index -- these are NOT the pinned digest:'
    printf '%s\n' "$platform_refs" | sed 's/^/       /'
  fi
fi

hex="${digest#sha256:}"

printf '\n   Digests for %s\n\n' "$REF"
printf '     Coolify form  docker_registry_image_tag : sha256-%s\n' "$hex"
printf '     Docker form   image@sha256:<hex>        : %s@%s\n' "$IMAGE" "$digest"
printf '\n'
printf '     The first is what you paste into rollback.sh as ROLLBACK_TO and what\n'
printf '     Coolify stores in the panel: a HYPHEN and no colon. The second is\n'
printf '     the standard Docker form, what you see in the compose file Coolify\n'
printf '     generates and in the RepoDigests verify-deploy.sh prints. They are\n'
printf '     the same value written two ways.\n'
printf '\n'

# ===========================================================================
say 'verdict'
# ===========================================================================

printf '   If this host can reach %s, then Coolify can pull it as user %s.\n' "$REF" "$(id -un)"

print_summary

if [ "$FAILED" -ne 0 ]; then
  printf '\nNot ready to deploy. Fix the failed check above and re-run this script;\n'
  printf 'do not start a deploy while any of them is red.\n'
  exit 1
fi

cat <<'DONE'

  Next
  ----
  1. Pin the panel to this exact build by setting docker_registry_image_tag to
     the Coolify form printed above (sha256-<hex>). rollback.sh can do that
     from the command line.
  2. Confirm that the server really runs that build, and not merely some running
     process, with:

       EXPECTED_DIGEST=sha256-<hex> bash verify-deploy.sh

  3. Keep REGISTRY_TOKEN out of the repository and out of any workflow file. It
     belongs in this one file on this one machine, and in a CI secret named for
     the same purpose.
DONE

exit 0
