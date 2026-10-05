#!/usr/bin/env bash
#
# verify-deploy.sh -- answer two questions after a deploy:
#
#   1. what is actually running on this host right now?
#   2. is it the build I think it is?
#
# Those are different questions and only the second one is worth anything during
# an incident. A process that answers HTTP 200 proves the process is up. It says
# nothing about WHICH build that process is running, because a stale container
# answers 200 just as cheerfully as a fresh one -- it is the same process, from
# last week's image, still serving traffic. The only value that identifies a
# build is the image digest, which is why CI pins the Coolify resource to a
# SHA256 digest and why EXPECTED_DIGEST below is the check that matters.
#
# A moving tag such as :main cannot answer that question. By the time you
# read the tag it may already point somewhere else, and "I checked and the tag
# was right" is not evidence about the container that is running.
#
# Run it ON THE DEPLOY HOST, as the user Coolify SSHes as, so that "docker ps"
# describes the machine that actually serves traffic. Running it on a laptop
# answers a different question and the answer is worthless.
#
# Usage:
#   # what is running, and is the app answering at all
#   bash verify-deploy.sh
#
#   # the real check: is production running the build CI published?
#   EXPECTED_DIGEST=sha256-3f786850e387550fdab836ed7e6dc881de23001b \
#     bash verify-deploy.sh
#
#   # the standard Docker spelling works too, with or without the leading @
#   EXPECTED_DIGEST=sha256:3f786850e387550fdab836ed7e6dc881de23001b \
#     bash verify-deploy.sh
#
#   # the public hostname, when you keep it in one place
#   HEALTH_URL="${KOGAION_PUBLIC_URL}/api/health" \
#   EXPECTED_DIGEST=sha256-3f786850e387550fdab836ed7e6dc881de23001b \
#     bash verify-deploy.sh
#
#   # straight at the container, skipping the reverse proxy and the public
#   # certificate. The difference between "the app is broken" and "the proxy
#   # is broken" is one command, so run both when the public URL is red.
#   HEALTH_URL=http://127.0.0.1:3000/api/health \
#   EXPECTED_DIGEST=sha256-3f786850e387550fdab836ed7e6dc881de23001b \
#     bash verify-deploy.sh
#
# Where the expected digest comes from: the output of the CI run that built the
# commit you deployed, or the digest login-registry.sh prints for the immutable
# sha-<commit> tag you expect. This project publishes exactly two tags, main and
# sha-<commit>, and main is the moving one described above -- a digest is the
# only form that still means the same thing when you read it twice. Do NOT take
# it from "docker ps" on this machine, because that is the thing being tested.
#
# ONE PORT, THREE PLACES. The HEALTHCHECK baked into the image probes this same
# /api/health route, and that probe is written for bun, because bun is the
# runtime in the final stage of the Dockerfile -- there is no node binary in the
# shipped image, so a "node -e ..." probe cannot even start. A port change has to
# reach all three of these, not one of them:
#
#   1. the Dockerfile  -- EXPOSE, the ENV PORT it sets, and the HEALTHCHECK line
#   2. Coolify        -- Ports / Exposes on the application, the container port
#   3. this script    -- the default HEALTH_URL below
#
# Change two out of three and you get the worst kind of failure: the deploy log
# says healthy while the domain answers 000, or the probe kills a perfectly good
# container in a restart loop.
#
# Requires: docker and curl. Read only: nothing is created, changed or removed.
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration.
# ---------------------------------------------------------------------------

HEALTH_URL="${HEALTH_URL:-https://kogaionacademy.ro/api/health}"
EXPECTED_DIGEST="${EXPECTED_DIGEST-}"
CURL_MAX_TIME="${CURL_MAX_TIME:-15}"

# How many lines of the health response body to print. The body is a few hundred
# bytes; this is only a guard against a reverse proxy that answers 200 with an
# HTML error page nobody would read in full.
HEALTH_MAX_LINES=40

# ---------------------------------------------------------------------------
# Output helpers. Every check is printed as it happens AND recorded, so the
# closing summary is a checklist rather than a verdict line: when this is run at
# 2am the useful question is "which of these is broken".
# ---------------------------------------------------------------------------

SUMMARY=''
PASSED=0
FAILED=0

say()  { printf '\n== %s ==\n' "$*"; }
note() { printf '   ..    %s\n' "$*"; }

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
die() {
  fail "$1"
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  %s\n' "$2" >&2
  print_summary
  exit 1
}

# Print at most N lines of stdin. awk "NR<=n" rather than "head -n n": head
# closes the pipe early, the writer dies on SIGPIPE, and "set -o pipefail"
# correctly reports that as failure 141, which would abort the script in the
# middle of printing a success message.
first_n() {
  awk -v n="$1" 'NR <= n'
}

# Reduce any spelling of an image digest to the bare 64 character hex value, so
# that sha256-<hex>, sha256:<hex>, <repo>@sha256:<hex> and bare hex all compare
# equal. All of those spellings occur in practice: Coolify stores the hyphenated
# form in docker_registry_image_tag and writes the colon form into the compose
# file it generates, so an operator copying a value out of the panel and an
# operator copying one out of a compose file must not be told their digests
# differ.
normalize_digest_hex() {
  local d="$1"
  # Lowercase FIRST, then strip. In the reverse order an uppercase spelling
  # slips past every prefix pattern below and survives as "SHA256-<hex>", which
  # is then reported as "not a digest" for a value that plainly is one.
  d="$(printf '%s' "$d" | tr '[:upper:]' '[:lower:]')"
  d="${d#@}"       # a leading @
  d="${d##*@}"     # keep only what follows the last @, for a full reference
  d="${d#sha256-}" # Coolify form: sha256-<hex>
  d="${d#sha256:}" # Docker form:   sha256:<hex>
  printf '%s' "$d"
}

# True when the argument is exactly 64 lowercase hex characters. The length is
# checked first because the character-class test alone accepts any length, and a
# truncated digest is exactly the kind of typo that otherwise sails through.
valid_sha256_hex() {
  local value="$1"
  [ "${#value}" -eq 64 ] || return 1
  case "$value" in
    *[!0-9a-f]*) return 1 ;;
  esac
  return 0
}

# Pull one string field out of a JSON body, without jq. jq is absent on a
# minimal deploy host, and adding a package to a read-only diagnostic in order
# to save one grep is a bad trade. This parser is deliberately dumb: it finds
# the LAST "key": "value" on a line, so nested objects and escaped quotes are
# not handled. That is acceptable because the result is used to REPORT what the
# application said, never to make a decision the application does not make
# itself. Empty output means "the key is not there", never "the key is false".
json_string_field() {
  local body_file="$1" key="$2"
  [ -s "$body_file" ] || return 0
  sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$body_file" 2>/dev/null \
    | first_n 1 || true
  return 0
}

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

HEALTH_BODY="$WORK_DIR/health.json"

# Read out of the health body, reported in step 5. Declared up front so that
# "set -u" cannot turn a missing field into an unbound variable error, which
# would look like a script crash rather than a finding.
reported_status=''
reported_commit=''

# ---------------------------------------------------------------------------
# Normalise and validate EXPECTED_DIGEST before touching docker, so that a typo
# is reported as a typo instead of surfacing later as "the container is not
# running your build", which is the same message for a very different problem.
# ---------------------------------------------------------------------------

EXPECTED_HEX=''
if [ -n "$EXPECTED_DIGEST" ]; then
  EXPECTED_HEX="$(normalize_digest_hex "$EXPECTED_DIGEST")"
  if ! valid_sha256_hex "$EXPECTED_HEX"; then
    echo 'ERROR: EXPECTED_DIGEST is not a sha256 digest.' >&2
    printf '  You passed: %s\n' "$EXPECTED_DIGEST" >&2
    printf '  After normalising, that is [%s] -- %s characters, not 64 hex.\n' \
      "$EXPECTED_HEX" "${#EXPECTED_HEX}" >&2
    printf '\nWhat to do next:\n' >&2
    printf '  Copy the whole digest from the CI run that built the commit, or from\n' >&2
    printf '  the output of login-registry.sh. Any of these spellings are accepted:\n' >&2
    printf '    sha256-<64 hex characters>                    the Coolify form\n' >&2
    printf '    sha256:<64 hex characters>                    the Docker form\n' >&2
    printf '    ghcr.io/owner/repo@sha256:<64 hex characters>  a full reference\n' >&2
    exit 2
  fi
fi

# ---------------------------------------------------------------------------
# Tooling.
# ---------------------------------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
  echo 'ERROR: the docker CLI is not on PATH.' >&2
  printf '  This script has to run on the deploy host, as the user Coolify SSHes\n' >&2
  printf '  as. Running it on your own machine answers a question nobody asked.\n' >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo 'ERROR: curl is not on PATH.' >&2
  printf '  Install it (apt-get install -y curl) and re-run.\n' >&2
  exit 1
fi

note "user       $(id -un)  (uid $(id -u))"
note "host       $(hostname)"
note "health url $HEALTH_URL"
if [ -n "$EXPECTED_HEX" ]; then
  note "expecting  sha256-$EXPECTED_HEX"
else
  note 'expecting  (nothing: EXPECTED_DIGEST is not set)'
fi

# ===========================================================================
say '1. running containers'
# ===========================================================================

# Name, status and image, which is the triage view: the image column already
# tells you whether the container is running something from ghcr.io at all, or
# something a panel built locally under a name with no registry prefix.
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

container_ids="$(docker ps --quiet)"

if [ -z "$container_ids" ]; then
  die 'no containers are running on this host' \
    'Nothing at all is running, so there is nothing to verify. If a deploy just happened, read its log in the panel: panel -> the application -> Deployments -> the latest run. A failed pull shows up there as "manifest unknown" or "unauthorized", and both mean the deploy never got as far as starting a container.'
fi

# ===========================================================================
say '2. what each running container is actually running'
# ===========================================================================

# Three different identifiers, and confusing them is the single biggest time
# sink in this kind of investigation:
#
#   requested ref  what was asked for, e.g.
#                  ghcr.io/mirelconstantin/kogaionacademy.ro@sha256:...
#                  This is the argument, not a fact about what is on disk;
#   image id       the local content-addressed image the container was created
#                  from, sha256:<hex>. It identifies the image ON THIS HOST and
#                  says nothing about where that image came from;
#   repo digests   the registry-qualified content addresses, e.g.
#                  ghcr.io/mirelconstantin/kogaionacademy.ro@sha256:<hex>. This
#                  is the one that can be compared against what CI published,
#                  because it carries the registry path as well as the hash.
#
# RepoDigests is EMPTY for an image that was built locally rather than pulled, so
# an empty value is itself a finding: nothing on this host came from ghcr.io.
DETAIL_TEMPLATE='     requested ref : {{.Config.Image}}
     image id      : {{.Image}}
     repo digests  : {{range .RepoDigests}}{{println .}}{{end}}
     created       : {{.Created}}
     started       : {{.State.StartedAt}}
     state         : {{.State.Status}}'

RUNNING_DIGESTS=''
MATCH_COUNT=0
MATCHED_CONTAINER=''
MATCHED_DIGEST=''
MATCHED_REQUESTED=''
NO_DIGEST_CONTAINERS=''

while IFS= read -r cid; do
  [ -n "$cid" ] || continue

  container_name="$(docker inspect --format '{{.Name}}' "$cid" 2>/dev/null || printf 'unknown')"
  requested_ref="$(docker inspect --format '{{.Config.Image}}' "$cid" 2>/dev/null || printf 'unknown')"
  # The daemon stores container names with a leading slash; strip it so the
  # output matches exactly what "docker ps" printed above.
  container_name="${container_name#/}"

  printf '\n   %s (%s)\n' "$container_name" "$cid"
  docker inspect --format "$DETAIL_TEMPLATE" "$cid" 2>/dev/null \
    || printf '     (docker inspect failed for this container)\n'

  digests="$(docker inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$cid" 2>/dev/null || true)"
  has_digest='no'
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    has_digest='yes'
    RUNNING_DIGESTS="${RUNNING_DIGESTS}  ${d}\n"
    if [ -n "$EXPECTED_HEX" ] && [ "$(normalize_digest_hex "$d")" = "$EXPECTED_HEX" ]; then
      MATCH_COUNT=$(( MATCH_COUNT + 1 ))
      MATCHED_CONTAINER="$container_name"
      MATCHED_DIGEST="$d"
      MATCHED_REQUESTED="$requested_ref"
    fi
  done <<EOF
$digests
EOF
  if [ "$has_digest" = 'no' ]; then
    NO_DIGEST_CONTAINERS="${NO_DIGEST_CONTAINERS} ${container_name}\n"
  fi
done <<EOF
$container_ids
EOF

# ===========================================================================
say '3. is the running build the build you expected'
# ===========================================================================

if [ -n "$NO_DIGEST_CONTAINERS" ]; then
  note 'these containers report no registry digest, so they were NOT pulled from'
  note 'a registry -- the image was built locally on this host:'
  printf '%b' "$NO_DIGEST_CONTAINERS" | sed 's/^/     /'
fi

if [ -z "$EXPECTED_HEX" ]; then
  note 'EXPECTED_DIGEST is not set, so this script CANNOT answer whether the'
  note 'running build is the build you expect. It can only report what is running'
  note 'and that something answers HTTP 200.'
  printf '\n'
  printf '     Every image digest currently running on this host:\n'
  if [ -n "$RUNNING_DIGESTS" ]; then
    printf '%b' "$RUNNING_DIGESTS"
  else
    printf '       (none: no running container reports a registry digest)\n'
  fi
  printf '\n'
  note 'Re-run with EXPECTED_DIGEST=sha256-<hex> to turn this into a real check.'
else
  if [ "$MATCH_COUNT" -gt 0 ]; then
    pass "a running container is on the expected digest (sha256-$EXPECTED_HEX)"
    note "container: $MATCHED_CONTAINER"
    note "requested:  $MATCHED_REQUESTED"
    note "digest:     $MATCHED_DIGEST"
    if [ "$MATCH_COUNT" -gt 1 ]; then
      note "$MATCH_COUNT containers share that digest, which is normal during a"
      note 'rolling restart: the old and the new can overlap for a few seconds.'
    fi
  else
    # This is the check that catches a stale deploy, so it fails LOUDLY and says
    # precisely what a mismatch means, instead of reporting a bare difference.
    record FAIL 'no running container matches EXPECTED_DIGEST'
    printf '   FAIL  no running container is on the expected digest (sha256-%s)\n' "$EXPECTED_HEX" >&2
    printf '\n' >&2
    printf '   WHAT THIS MEANS\n' >&2
    printf '   ----------------------------------------------------------------\n' >&2
    printf '   The site is up and serving traffic, but it is NOT running the build\n' >&2
    printf '   that CI published. Coolify is serving a different image than the one\n' >&2
    printf '   the pipeline produced. In practice there are only two causes:\n' >&2
    printf '\n' >&2
    printf '     a) the deploy never ran. CI published an image and either the\n' >&2
    printf '        webhook did not fire, or the panel queued the deploy and it\n' >&2
    printf '        failed. Read the log: panel -> your application -> Deployments.\n' >&2
    printf '\n' >&2
    printf '     b) the deploy ran but pulled the wrong thing. The resource is pinned\n' >&2
    printf '        by digest, so this happens when docker_registry_image_tag still\n' >&2
    printf '        holds an older digest, or when somebody edited that field in the\n' >&2
    printf '        panel after CI pinned it.\n' >&2
    printf '\n' >&2
    printf '   WHAT IS RUNNING INSTEAD\n' >&2
    if [ -n "$RUNNING_DIGESTS" ]; then
      printf '%b' "$RUNNING_DIGESTS" | sed 's/^/     /' >&2
    else
      printf '     (no running container reports a registry digest at all)\n' >&2
    fi
    printf '\n' >&2
    printf '   WHAT TO DO NEXT\n' >&2
    printf '     1. Confirm which of (a) or (b) it is by reading the Deployments tab\n' >&2
    printf '        in the panel, BEFORE changing anything else.\n' >&2
    printf '     2. To make production run the expected digest right now:\n' >&2
    printf '          KOGAION_COOLIFY_URL=https://panel.example.com \\\n' >&2
    printf '          KOGAION_COOLIFY_TOKEN=... COOLIFY_APP_FQDN=kogaionacademy.ro \\\n' >&2
    printf '            ROLLBACK_TO=%s bash rollback.sh\n' "$EXPECTED_DIGEST" >&2
    printf '        (roll forward and roll back are the same operation here: one\n' >&2
    printf '        field, one digest, one deploy.)\n' >&2
    printf '     3. Do NOT restart the container as a fix. Restarting re-pulls the\n' >&2
    printf '        same pinned digest, so you get the same old build back, and you\n' >&2
    printf '        destroy the evidence about what went wrong.\n' >&2
    print_summary
    exit 1
  fi
fi

# ===========================================================================
say '4. does the app answer'
# ===========================================================================

# READ THIS BEFORE TRUSTING THE RESULT BELOW.
#
# A 2xx from /api/health proves the PROCESS is up. It does not prove that the
# process is running the new build, that any of the new code paths work, or that
# the deploy finished. A container from three days ago answers this exact request
# with the exact same 200. The digest comparison in step 3 is what establishes
# WHICH build is running; this step only establishes that something is listening
# and that the process can serve a request without falling over.
#
# /api/health is a liveness route and it touches NO DATABASE. Read that as the
# strong statement it is: with Postgres stopped, unreachable or mid-failover, this
# endpoint still answers 200 with status:ok. A green result here is therefore NOT
# evidence that the database answers, and nothing this script prints is.
#
# That is a decision, not a defect. A readiness probe that queried the database
# would declare every replica dead during a recoverable dependency incident and
# restart all of them, turning a degraded application into a dead one. The data
# layer is checked the expensive way instead: by loading a page that reads it, or
# by asking the database directly. Do not "fix" this by adding a query to the
# health route -- that is exactly the failure mode the route is designed to
# avoid.
#
# Which is also why the digest comparison in step 3 exists: the health route is
# designed to be incapable of telling you whether the deploy worked.
#
# The HEALTHCHECK in the image probes this same route, written for bun -- the
# runtime in the final stage of the Dockerfile is bun, there is no node binary to
# call. If the probe and this URL disagree about the port, the symptom is a
# container that restarts itself in a loop while the application answers
# perfectly well on the host port. The port lives in three places: the Dockerfile,
# Coolify (Ports / Exposes) and the HEALTH_URL default below.

health_code="$(curl --silent --show-error --location \
                  --max-time "$CURL_MAX_TIME" \
                  --output "$HEALTH_BODY" \
                  --write-out '%{http_code}' \
                  "$HEALTH_URL")" || health_code='000'

case "$health_code" in
  2*)
    pass "$HEALTH_URL answered $health_code (the process is up)"
    ;;
  000)
    die "no HTTP response at all from $HEALTH_URL" \
      "Either nothing is listening on that address or the request never left this host. Check in this order: (1) does the container expose a port and is it published to the host -- the docker ps table above shows the published ports; (2) is the reverse proxy routing this hostname to that port, compare with the resource's domain setting in the panel; (3) is a firewall in between; (4) did the request time out because the app is wedged -- raise CURL_MAX_TIME and re-run."
    ;;
  404)
    die "$HEALTH_URL answered 404" \
      "Something answered, but not the application, or not this route. If a proxy is in front, it may be answering on the application's behalf. Confirm the route exists in the repository (src/routes/api/health/+server.ts) and that the hostname in HEALTH_URL points at this application and not at a parked domain."
    ;;
  401|403)
    die "$HEALTH_URL answered $health_code" \
      "The route is behind authentication, which makes it useless as a liveness probe: the panel's own health check will fail the same way and will fail every deploy. A health route must answer without credentials so that the platform can use it to decide the deploy succeeded."
    ;;
  5??)
    die "$HEALTH_URL answered $health_code" \
      "The process is up and failing on the request. Read the container logs before touching the deploy: docker logs --tail 200 CONTAINER_NAME. A missing runtime secret or an unreachable dependency typically shows up here rather than at container start, precisely because /api/health touches no database."
    ;;
  *)
    die "$HEALTH_URL answered $health_code" \
      "Unexpected status. Look at the body printed below and at the reverse proxy logs for this hostname; an unexpected status from a proxy is usually a TLS, host-header or rate-limit problem rather than an application problem."
    ;;
esac

printf '\n   Response body from %s\n\n' "$HEALTH_URL"
if [ -s "$HEALTH_BODY" ]; then
  first_n "$HEALTH_MAX_LINES" < "$HEALTH_BODY" | sed 's/^/     /'
  body_lines="$(wc -l < "$HEALTH_BODY" | tr -d ' ')"
  if [ "$body_lines" -gt "$HEALTH_MAX_LINES" ]; then
    note 'body truncated; curl the endpoint directly if you need all of it'
  fi
  # checks.authSecret.healthy is worth naming explicitly: it is the one field
  # in the body that reports a real deployment defect rather than mere liveness,
  # so an operator skimming this output should not miss it. It sits under
  # "checks", not at the top level, because it is one check among the ones the
  # next step reads.
  if grep -q '"authSecret"' "$HEALTH_BODY"; then
    note 'checks.authSecret is in the body above. healthy:true means the'
    note 'application found its own secret; healthy:false means that variable'
    note 'is missing or wrong in the panel, and the app will fail on first real'
    note 'use even though this endpoint answered 200.'
  fi
else
  note '(empty body)'
fi
printf '\n'

# The one thing this endpoint cannot tell you, said out loud at 2am.
note '/api/health does NOT touch the database. A 2xx here -- and even'
note 'status:ok in the body -- does not prove the database answers: with'
note 'Postgres down this application still reports ok. That is a decision,'
note 'not a defect. Check the data layer separately: load a page that reads'
note 'it, or query the database directly.'
printf '\n'

# ===========================================================================
say '5. does the health body name the build that is running'
# ===========================================================================

# This step reads the JSON the health route wrote, using the sed-based reader
# above instead of jq, for the reason given there. What it buys is the last
# link of the chain: step 3 proved that a container runs the digest CI
# published, and this proves the process inside that image reports the commit
# CI built. A digest identifies an image; a commit identifies the source that
# image was built from; the two agreeing is what makes "the deploy worked" a
# statement about the application rather than about Docker.

health_body_head=''
if [ -s "$HEALTH_BODY" ]; then
  health_body_head="$(first_n 1 < "$HEALTH_BODY" | tr -d '[:space:]')"
fi

case "$health_body_head" in
  '{'*)
    ;;
  *)
    record FAIL 'the health route answered 2xx without a JSON body'
    printf '   FAIL  the body does not start with {, so it is not the health route\n' >&2
    printf '\n' >&2
    printf '   WHAT THIS MEANS\n' >&2
    printf '   ----------------------------------------------------------------\n' >&2
    printf '   Something answered 2xx, but not this application. The usual cause is a\n' >&2
    printf '   reverse proxy answering on its behalf -- a default landing page, or a\n' >&2
    printf '   domain that returns 200 for everything.\n' >&2
    printf '\n' >&2
    printf '   WHAT TO DO NEXT\n' >&2
    printf '     1. Read the body printed above. <!DOCTYPE or <html> at the top means\n' >&2
    printf '        the proxy answered and the application was never reached.\n' >&2
    printf '     2. Separate application from proxy in one command:\n' >&2
    printf '          HEALTH_URL=http://127.0.0.1:3000/api/health bash verify-deploy.sh\n' >&2
    printf '     3. Confirm the route exists and answers without credentials:\n' >&2
    printf '        src/routes/api/health/+server.ts\n' >&2
    print_summary
    exit 1
    ;;
esac

reported_status="$(json_string_field "$HEALTH_BODY" status)"
reported_commit="$(json_string_field "$HEALTH_BODY" commit)"

if [ "$reported_status" = 'ok' ]; then
  pass 'the health body reports status:ok'
else
  die "the health body does not report status:ok (it reports '${reported_status:-nothing}')" \
    "The body above is the application's own verdict, and it is not ok even though the HTTP status was 2xx -- liveness and readiness are separate answers and this endpoint answers only the first. If the body says degraded or down, the route is reporting a real problem: read docker logs --tail 200 CONTAINER_NAME before touching the deploy. If the body says nothing about status at all, HEALTH_URL is pointing at a different application, and the fix is the URL, not the deploy."
fi

if [ -n "$reported_commit" ] && [ "$reported_commit" != 'unknown' ]; then
  pass "the health body reports commit $reported_commit"
else
  die "the health body does not report a commit (it reports '${reported_commit:-nothing}')" \
    "The commit is how the running process names the source it was built from, and it is missing. The health route reports GIT_SHA from the environment, so this is wiring, not an application bug: (1) the pipeline must pass GIT_SHA as a build argument, which the Dockerfile declares as ARG GIT_SHA; (2) if the image is right but this is still empty, the running container predates the build that added the field, so re-check step 3; (3) do NOT read a missing commit as a pass -- the digest check stands on its own, but the pipeline -> image -> process chain now has a hole in it."
fi

printf '\n'
printf '   The chain\n\n'
if [ -n "$EXPECTED_HEX" ]; then
  printf '     digest CI published        : sha256-%s\n' "$EXPECTED_HEX"
else
  printf '     digest CI published        : (not given -- set EXPECTED_DIGEST to compare)\n'
fi
printf '     commit the container reports: %s\n' "$reported_commit"
printf '\n'
note 'Those two name the same build only if the commit the container reports is the'
note 'commit the pipeline ran. Check it against the CI run that published the'
note 'digest: pipeline at commit X, container reports X, digest matches. If the'
note 'commits differ, no amount of green HTTP makes this the build you deployed.'
printf '\n'

if grep -q '"healthy"[[:space:]]*:[[:space:]]*false' "$HEALTH_BODY"; then
  record FAIL 'a check under "checks" reports healthy:false'
  printf '   FAIL  the body printed above contains "healthy": false\n' >&2
  printf '\n' >&2
  printf '   WHAT THIS MEANS\n' >&2
  printf '   ----------------------------------------------------------------\n' >&2
  printf '   Liveness stayed 2xx on purpose: a container is not restarted because a\n' >&2
  printf '   secret is weak, because the restart would bring the same secret back.\n' >&2
  printf '   The process is serving traffic and is, at the same time, misconfigured.\n' >&2
  printf '\n' >&2
  printf '   WHAT TO DO NEXT\n' >&2
  printf '     1. Read the offending check in the body above: checks.authSecret\n' >&2
  printf '        carries a "problems" array with the exact reason.\n' >&2
  printf '     2. Fix it in Coolify, on the single application, as a RUNTIME variable.\n' >&2
  printf '        A build argument is baked into the image and needs a rebuild.\n' >&2
  printf '     3. Do NOT restart the container as the fix: it comes back with the\n' >&2
  printf '        same variables and the same answer.\n' >&2
  print_summary
  exit 1
elif grep -q '"authSecret"' "$HEALTH_BODY"; then
  pass 'checks.authSecret is present and healthy:true'
else
  record FAIL 'the health body carries no checks.authSecret'
  printf '   FAIL  no "authSecret" key anywhere in the body printed above\n' >&2
  printf '\n' >&2
  printf '   WHAT THIS MEANS\n' >&2
  printf '   ----------------------------------------------------------------\n' >&2
  printf '   This application is expected to report checks.authSecret.healthy, and it\n' >&2
  printf '   reports no checks at all. Either the running image predates the route\n' >&2
  printf '   change -- check the digest in step 3 -- or the field was dropped from the\n' >&2
  printf '   route, which quietly removes the one signal that catches a missing or\n' >&2
  printf '   weak BETTER_AUTH_SECRET before a session can be forged.\n' >&2
  print_summary
  exit 1
fi

printf '\n'

# ===========================================================================
say 'verdict'
# ===========================================================================

print_summary

if [ "$FAILED" -ne 0 ]; then
  printf '\nSomething above is red. Fix it before trusting any other signal.\n'
  exit 1
fi

if [ -n "$EXPECTED_HEX" ]; then
  printf '\n  The running digest is the one CI published, and the app answers.\n'
  printf '  Together those are the whole definition of a good deploy.\n'
  printf '  The process reports commit %s, so the pipeline, the image and the\n' "$reported_commit"
  printf '  running code all name the same build.\n'
  printf '\n'
  printf '  What this did NOT prove: that the database answers. /api/health does\n'
  printf '  not touch it, by design. Check the data layer separately.\n'
else
  printf '\n  The app answers, but nothing proved WHICH build is running, because\n'
  printf '  EXPECTED_DIGEST was not set. Re-run with it before calling this green.\n'
fi

exit 0
