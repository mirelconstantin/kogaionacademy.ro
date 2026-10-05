#!/usr/bin/env bash
#
# rollback.sh -- move the deployment back to a specific published image, through
# the panel's API rather than by hand-editing fields in the panel UI.
#
# Why an API and not the UI: a rollback performed by a person is remembered
# differently by every person. The panel keeps no record of "somebody typed a
# digest into this field at 3am", so six weeks later nobody can say why
# production is on an old build. This script writes the change, proves the write
# landed, starts the deploy, waits for it to reach a terminal state, and prints
# the whole sequence -- so the console is the audit trail.
#
# Why a DIGEST and not a tag: CI publishes two kinds of tag. The moving one
# (main) follows whatever that branch last built, so rolling "back to main" does
# not roll back at all. The immutable one (sha-<full 40 character commit sha>)
# names exactly one build and never moves. Rolling back to an immutable
# reference, or to the digest it resolves to, is the only kind of rollback that
# is still a rollback a month later.
#
# Roll FORWARD and roll BACK are the same operation here. The Coolify resource
# is of type "Docker Image" and its docker_registry_image_tag field holds a
# SHA256 digest; this script sets that field and starts a deploy. There is no
# separate forward path, and there does not need to be one.
#
# COOLIFY_APP_FQDN ACCEPTS EITHER A DOMAIN OR A UUID. The name is historical;
# read it as "the application reference". Both forms are useful and neither is
# guessed:
#
#   a domain  -> the script asks the panel which application serves it and takes
#                the uuid from the answer. Nothing has to be copied by hand, so
#                there is no value to get wrong when the resource is recreated.
#   a uuid    -> used as it is, with no listing call at all. This is the
#                repository variable the CI pipeline uses (KOGAION_APP_UUID), so
#                an operator reading a failed run can copy the same value here
#                and address exactly the resource CI addressed.
#
# The two forms are told apart by shape, not by a flag: a Coolify id is a short
# in the 8-4-4-4-12 hex layout, which no host name has. A value that is neither
# a host name nor a uuid is rejected by name.
#
# Discovery by domain still stops at both ends of the ambiguity range. Zero means
# the domain is not deployed on this panel at all. Two means a second resource
# was created on the same domain, at which point the panel cannot tell them
# apart by anything this script can see, and choosing between them at 2am is how
# the wrong site gets overwritten. Both cases stop the script and print what the
# panel does know. Discovery happens before the registry pre-flight, and
# therefore before any write.
#
# NOTHING IS CHANGED UNTIL THE TARGET HAS BEEN PROVEN TO EXIST. If the image
# cannot be resolved in the registry, the script aborts having touched neither
# the panel nor the deployment. Pinning a resource to an image that does not
# exist turns a recoverable mistake into an outage: the next deploy fails at pull
# time, and until somebody reads the deploy log the site is simply down.
#
# Usage:
#   # read-only: show what is pinned now and exactly what would change
#   KOGAION_COOLIFY_URL=https://panel.example.com \
#   KOGAION_COOLIFY_TOKEN=coolify_api_token_here \
#   COOLIFY_APP_FQDN=kogaionacademy.ro \
#   ROLLBACK_TO=sha256-3f786850e387550fdab836ed7e6dc881de23001b \
#     bash rollback.sh --dry-run
#
#   # roll back to an immutable commit tag; it is resolved to a digest first
#   KOGAION_COOLIFY_URL=https://panel.example.com \
#   KOGAION_COOLIFY_TOKEN=coolify_api_token_here \
#   COOLIFY_APP_FQDN=kogaionacademy.ro \
#   ROLLBACK_TO=sha-9f1c0b2d4e5a6f7089abcdef0123456789abcdef \
#     bash rollback.sh
#
#   # roll forward to a newer digest. Identical mechanics, opposite direction.
#   KOGAION_COOLIFY_URL=https://panel.example.com \
#   KOGAION_COOLIFY_TOKEN=coolify_api_token_here \
#   COOLIFY_APP_FQDN=example.com \
#   ROLLBACK_TO=sha256:9a1b2c3d4e5f60718293a4b5c6d7e8f901122334 \
#     bash rollback.sh
#
#   # a longer wait for a cold host, where the pull alone can take minutes
#   POLL_TIMEOUT=1800 bash rollback.sh
#
#   # address the resource by uuid instead of by domain. No listing call is made,
#   # so this is the shortest path from a digest that failed to the resource that
#   # is pinned to it -- and it is the same reference the CI pipeline uses.
#   KOGAION_COOLIFY_URL=https://panel.example.com \
#   KOGAION_COOLIFY_TOKEN=coolify_api_token_here \
#   COOLIFY_APP_FQDN=1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d \
#   ROLLBACK_TO=sha-9f1c0b2d4e5a6f7089abcdef0123456789abcdef \
#     bash rollback.sh --dry-run
#
# Required:
#   KOGAION_COOLIFY_URL   panel base URL WITHOUT the /api/v1 suffix. A trailing
#                         slash is fine and is stripped. Pasting the full API URL
#                         also works and is corrected, with a note.
#   KOGAION_COOLIFY_TOKEN panel API token, created in the panel under Settings ->
#                         API Tokens. A token is a bearer credential for the whole
#                         panel; treat it exactly like a password.
#   COOLIFY_APP_FQDN      either the domain the application serves (for example
#                         kogaionacademy.ro -- host only: no scheme, no port, no
#                         path, no trailing slash), in which case the uuid is
#                         discovered from it, or the resource's uuid itself (36
#                         characters, 8-4-4-4-12 hex), in which case it is used as
#                         given. The uuid is the same value the pipeline reads
#                         from the KOGAION_APP_UUID repository variable.
#   ROLLBACK_TO           either sha256-<64 hex> (Coolify form), sha256:<64 hex>
#                         (Docker form), sha-<full 40 character commit sha>, or a
#                         full reference such as
#                         ghcr.io/mirelconstantin/kogaionacademy.ro:sha-<commit sha>
#                         in which case the repository must match IMAGE.
#
# Optional:
#   IMAGE             default ghcr.io/mirelconstantin/kogaionacademy.ro
#   POLL_INTERVAL     seconds between deployment status checks, default 5
#   POLL_TIMEOUT      seconds before giving up, default 900
#   --dry-run         stop after reading the current pin and print the change
#
# NOTE ON SECRETS: tracing is never switched on in this file, KOGAION_COOLIFY_TOKEN is
# passed to curl through a config document on stdin rather than through argv,
# and the token is never echoed, not even inside an error message.
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Flags, parsed before anything else so that --help works without credentials.
# ---------------------------------------------------------------------------

DRY_RUN='no'

print_usage() {
  sed -n '2,/^set -euo/p' "$0" | sed -e 's/^# \{0,1\}//' -e '/^set -euo/d'
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN='yes' ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument '$arg'." >&2
      printf 'This script takes no positional arguments; everything is either an\n' >&2
      printf 'environment variable or the single flag --dry-run. Run --help for usage.\n' >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Configuration.
# ---------------------------------------------------------------------------

IMAGE="${IMAGE:-ghcr.io/mirelconstantin/kogaionacademy.ro}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
POLL_TIMEOUT="${POLL_TIMEOUT:-900}"

# ---------------------------------------------------------------------------
# Required environment, reported all at once. A rollback is usually run from a
# command copied out of a shell history, so the common failure is one missing
# variable, and the fastest possible report is a list rather than a cascade.
# ---------------------------------------------------------------------------

missing=''
[ -n "${KOGAION_COOLIFY_URL-}" ]   || missing="${missing}KOGAION_COOLIFY_URL "
[ -n "${KOGAION_COOLIFY_TOKEN-}" ] || missing="${missing}KOGAION_COOLIFY_TOKEN "
[ -n "${COOLIFY_APP_FQDN-}" ]    || missing="${missing}COOLIFY_APP_FQDN "
[ -n "${ROLLBACK_TO-}" ]         || missing="${missing}ROLLBACK_TO "

if [ -n "$missing" ]; then
  printf 'ERROR: required environment variable(s) are not set: %s\n' "$missing" >&2
  printf '\nWhat to do next:\n' >&2
  printf '  All four are needed, and the whole thing runs as one command:\n' >&2
  printf '\n' >&2
  printf '    KOGAION_COOLIFY_URL=https://panel.example.com \\\n' >&2
  printf '    KOGAION_COOLIFY_TOKEN=coolify_api_token_here \\\n' >&2
  printf '    COOLIFY_APP_FQDN=kogaionacademy.ro \\\n' >&2
  printf '      ROLLBACK_TO=sha256-3f786850e387550fdab836ed7e6dc881de23001b \\\n' >&2
  printf '      bash rollback.sh --dry-run\n' >&2
  printf '\n' >&2
  printf '  Start with --dry-run: it reads the panel and changes nothing, which is the\n' >&2
  printf '  only way to find out whether a rollback is needed at all.\n' >&2
  printf '\n' >&2
  printf '  Where each value comes from:\n' >&2
  printf '    KOGAION_COOLIFY_URL   the panel address WITHOUT /api/v1. Open the panel\n' >&2
  printf '                          in a browser and copy the origin.\n' >&2
  printf '    KOGAION_COOLIFY_TOKEN panel -> Settings -> API Tokens -> create one.\n' >&2
  printf '    COOLIFY_APP_FQDN      the domain the resource is reached on, e.g.\n' >&2
  printf '                          kogaionacademy.ro. No https://, no trailing slash.\n' >&2
  printf '                          The uuid is looked up from it; nothing to copy\n' >&2
  printf '                          out of a panel URL.\n' >&2
  printf '    ROLLBACK_TO           a digest from the CI run, or sha-<commit sha>.\n' >&2
  exit 2
fi

# The token goes into a curl config document; a double quote or backslash would
# corrupt that document. Real panel tokens are [A-Za-z0-9-] only, so this only
# fires on a copy/paste accident, and the error is clearer than the 400 it would
# otherwise produce.
case "$KOGAION_COOLIFY_TOKEN" in
  *'"'*|*'\'*)
    echo 'ERROR: KOGAION_COOLIFY_TOKEN contains a double quote or a backslash, which cannot be' >&2
    echo '       passed safely to curl. Copy the token again from the panel.' >&2
    exit 2
    ;;
esac

# ---------------------------------------------------------------------------
# Normalise the panel URL.
#
# The API base is the panel URL without /api/v1, and people paste both forms. A
# doubled path (/api/v1/api/v1/...) produces a 404 from every endpoint, which is
# indistinguishable from a domain no application serves, so the suffix is
# stripped here and the operator is told it happened.
# ---------------------------------------------------------------------------

ORIGINAL_URL="$KOGAION_COOLIFY_URL"
KOGAION_COOLIFY_URL="${KOGAION_COOLIFY_URL%/}"
KOGAION_COOLIFY_URL="${KOGAION_COOLIFY_URL%/api/v1}"
KOGAION_COOLIFY_URL="${KOGAION_COOLIFY_URL%/}"

if [ "$KOGAION_COOLIFY_URL" != "$ORIGINAL_URL" ]; then
  printf 'NOTE: %s was rewritten to %s\n' "$ORIGINAL_URL" "$KOGAION_COOLIFY_URL" >&2
  printf '      The API base is the panel URL WITHOUT /api/v1. Set KOGAION_COOLIFY_URL to the\n' >&2
  printf '      bare panel address next time.\n' >&2
fi

case "$KOGAION_COOLIFY_URL" in
  http://*|https://*) : ;;
  *)
    echo "ERROR: KOGAION_COOLIFY_URL does not look like a URL: $KOGAION_COOLIFY_URL" >&2
    printf '  Expected something like https://panel.example.com\n' >&2
    printf '  Open the panel in a browser and copy the address from the location bar.\n' >&2
    exit 2
    ;;
esac

# ---------------------------------------------------------------------------
# Validate the target, which may be EITHER a bare host name OR an application id.
#
# The host form is what an operator already knows: it is what the browser shows.
# The id form is what the CI pipeline is configured with, so the same value that
# identifies the resource in GitHub identifies it here -- one thing to copy, and
# no second source of truth that could drift from the first.
#
# A host name is a short, boring alphabet, and the check is still needed: it is
# matched against the fqdn of every application the panel knows using a pattern
# built from it, so a value carrying a slash, a colon or a glob character would
# make that match mean something other than what it looks like. Restricting it to
# letters, digits, dots and dashes makes the match literal, which is why no
# escaping machinery appears anywhere else in this script.
# ---------------------------------------------------------------------------

APP_UUID_DIRECT=''

case "$COOLIFY_APP_FQDN" in
  '')
    echo 'ERROR: COOLIFY_APP_FQDN is not set:' >&2
    exit 2
    ;;
  *[!A-Za-z0-9.-]*)
    echo 'ERROR: COOLIFY_APP_FQDN is neither a bare host name nor an application id:' >&2
    printf '  %s\n' "$COOLIFY_APP_FQDN" >&2
    printf '  A host is compared against the fqdn of every application the panel\n' >&2
    printf '  knows, so it has to be the host and nothing else: no https://, no\n' >&2
    printf '  port, no path, no trailing slash. For example\n' >&2
    printf '  kogaionacademy.ro\n' >&2
    exit 2
    ;;
esac

# Which of the two forms was given, told apart by shape rather than by a flag.
#
# NOT the 36-character hex-with-dashes layout of a UUIDv4: Coolify ids are short
# lowercase alphanumeric runs of about 26 characters, e.g. 319uac7occnbhmn7eui9h0wt.
# A host name can never be one of those, because it has no run of 8+ lowercase
# letters and digits with no dot in it -- which is the property being relied on.
if printf '%s' "$COOLIFY_APP_FQDN" | grep -qE '^[a-z0-9]{8,40}$'; then
  APP_UUID_DIRECT="$COOLIFY_APP_FQDN"
fi

# The image name is interpolated into a JSON body too, so it gets the same
# treatment: only characters a real image reference can contain.
case "$IMAGE" in
  ''|*[!a-zA-Z0-9._/-]*)
    echo 'ERROR: IMAGE contains characters that cannot appear in an image reference:' >&2
    printf '  %s\n' "$IMAGE" >&2
    printf '  Expected ghcr.io/<owner>/<repo>, for example\n' >&2
    printf '  ghcr.io/mirelconstantin/kogaionacademy.ro\n' >&2
    exit 2
    ;;
esac

# Poll timings are validated too, because a non-numeric value reaches the
# arithmetic comparison further down and produces an error message about
# arithmetic where the real problem is a typo in a variable.
for setting in "POLL_INTERVAL=$POLL_INTERVAL" "POLL_TIMEOUT=$POLL_TIMEOUT"; do
  case "$setting" in
    *=0|*=*[!0-9]*)
      printf 'ERROR: %s must be a positive whole number of seconds.\n' "$setting" >&2
      printf '  For example: POLL_INTERVAL=5 POLL_TIMEOUT=1800\n' >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Digest helpers. Four spellings are accepted because four are produced in
# practice, and rejecting the wrong one of them costs an operator real time:
#
#   sha256-<hex>    the Coolify form, straight out of docker_registry_image_tag
#   sha256:<hex>    the Docker form, out of the compose file or "docker ps"
#   @sha256:<hex>   the tail of a full reference
#   sha-<40 hex>    an immutable CI commit tag, resolved to a digest below
#
# Everything else is rejected, including the moving tags. ROLLBACK_TO=main is a
# request to run a rollback that does not roll back.
# ---------------------------------------------------------------------------

normalize_digest_hex() {
  local d="$1"
  # Lowercase FIRST, then strip. In the reverse order an uppercase spelling
  # slips past every prefix pattern below and survives as "SHA256-<hex>", which
  # is then reported as "not a digest" for a value that plainly is one.
  d="$(printf '%s' "$d" | tr '[:upper:]' '[:lower:]')"
  d="${d#@}"
  d="${d##*@}"
  d="${d#sha256-}"
  d="${d#sha256:}"
  printf '%s' "$d"
}

# True when the argument is exactly 64 lowercase hex characters. The length is
# checked first because the character-class test alone accepts any length, and a
# truncated digest is exactly the kind of typo that would otherwise sail through
# and be compared against real values.
valid_sha256_hex() {
  local value="$1"
  [ "${#value}" -eq 64 ] || return 1
  case "$value" in
    *[!0-9a-f]*) return 1 ;;
  esac
  return 0
}

TARGET="${ROLLBACK_TO#@}"
TARGET="${TARGET#:}"
TARGET_KIND=''

# A FULL reference is accepted too -- ghcr.io/owner/repo:sha-<commit> or
# repo@sha256:<hex> -- because that is the form "docker ps" prints and the form
# the documentation shows people to type. The repository part is stripped and
# checked against IMAGE rather than ignored, so a reference naming a DIFFERENT
# image is rejected instead of being silently overridden by IMAGE.
REF_RECOGNISED='no'
REF_REPO=''
case "$TARGET" in
  */*@*|*/*:*)
    case "$TARGET" in
      */*@*) ref_repo="${TARGET%%@*}"; ref_tail="${TARGET#*@}" ;;
      *)     ref_repo="${TARGET%%:*}"; ref_tail="${TARGET#*:}" ;;
    esac
    if [ "$ref_repo" != "$IMAGE" ]; then
      echo 'ERROR: ROLLBACK_TO names a different image than IMAGE.' >&2
      printf '  ROLLBACK_TO : %s\n' "$ROLLBACK_TO" >&2
      printf '  its image   : %s\n' "$ref_repo" >&2
      printf '  IMAGE       : %s\n' "$IMAGE" >&2
      printf '\n  What to do next:\n' >&2
      printf '    Either pass only the tag or the digest, and let IMAGE supply the\n' >&2
      printf '    repository:\n' >&2
      printf '      ROLLBACK_TO=sha-<commit sha>\n' >&2
      printf '    or set IMAGE to the repository the reference names, if that is the\n' >&2
      printf '    image you actually meant to deploy.\n' >&2
      exit 2
    fi
    TARGET="$ref_tail"
    REF_RECOGNISED='yes'
    REF_REPO="$ref_repo"
    ;;
esac

if valid_sha256_hex "$(normalize_digest_hex "$TARGET")"; then
  TARGET_KIND='digest'
  TARGET_HEX="$(normalize_digest_hex "$TARGET")"
  TARGET_DIGEST="sha256:$TARGET_HEX"
elif [ "${#TARGET}" -eq 44 ] && [ "${TARGET#sha-}" != "$TARGET" ]; then
  case "${TARGET#sha-}" in
    *[!0-9a-f]*)
      echo "ERROR: ROLLBACK_TO looks like an immutable tag but is not one: $TARGET" >&2
      printf '  The part after sha- is not hexadecimal. A CI-published immutable tag is\n' >&2
      printf '  sha- followed by the FULL 40 character commit sha, never an abbreviation\n' >&2
      printf '  and never a branch name.\n' >&2
      exit 2
      ;;
  esac
  TARGET_KIND='tag'
  TARGET_HEX=''
  TARGET_DIGEST=''
else
  echo 'ERROR: ROLLBACK_TO is neither a sha256 digest nor an immutable commit tag.' >&2
  printf '  You passed: %s\n' "$ROLLBACK_TO" >&2
  printf '\n  Accepted forms:\n' >&2
  printf '    sha256-<64 hex characters>            the Coolify form\n' >&2
  printf '    sha256:<64 hex characters>            the Docker form\n' >&2
  printf '    @sha256:<64 hex characters>           a full reference tail\n' >&2
  printf '    sha-<40 character commit sha>         an immutable CI tag\n' >&2
  printf '\n  What to do next:\n' >&2
  printf '    1. To roll back to a specific commit, take the immutable tag from the\n' >&2
  printf '       GitHub Actions run that built it: sha- plus the full 40 character\n' >&2
  printf '       commit sha, printed in the run summary.\n' >&2
  printf '    2. To use a digest, copy it from a previous deployment: panel -> your\n' >&2
  printf '       application -> Deployments -> a deployment -> the image tag it\n' >&2
  printf '       recorded, or run login-registry.sh and take the Coolify form it\n' >&2
  printf '       prints.\n' >&2
  printf '    3. Do NOT pass the moving branch name main. That tag follows whatever the\n' >&2
  printf '       branch last built, so "rolling back" to it is a no-op at best and an\n' >&2
  printf '       unpredictable change at worst.\n' >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# Output helpers and scratch space.
# ---------------------------------------------------------------------------

say()  { printf '\n== %s ==\n' "$*"; }
note() { printf '   ..    %s\n' "$*"; }
warn() { printf '   WARN  %s\n' "$*"; }

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

HDR_FILE="$WORK_DIR/headers.txt"
BODY_FILE="$WORK_DIR/body.json"
ERR_FILE="$WORK_DIR/stderr.txt"

first_n() {
  awk -v n="$1" 'NR <= n'
}

# die <what failed> <what to do next>
#
# The second argument is mandatory by design. A message that only says what
# failed assumes the reader already knows the fix, which is exactly the state
# nobody is in at 3am.
die() {
  printf '   FAIL  %s\n' "$1" >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  %s\n' "$2" >&2
  exit 1
}

# The panel rate limits API calls and answers a busy one with 429 plus a
# Retry-After header. A rollback makes a burst of calls -- the PATCH, the
# read-back, the POST and one GET every POLL_INTERVAL seconds for as long as the
# deploy takes -- so a 429 here is a transient condition, not a verdict, and
# treating it as one would fail a rollback that was working. Up to
# KOGAION_429_RETRIES extra attempts are made, waiting whatever the panel asked
# for in Retry-After. The ceiling keeps a malformed or hostile value from
# parking the job for an hour.
KOGAION_429_RETRIES=5
KOGAION_429_MAX_WAIT=120

# Retry-After is a RESPONSE header, not a field in the body, so it has to come
# out of the dump file rather than out of the JSON. The spec also allows a date,
# which is not worth parsing for a header the panel sends in seconds; anything
# non-numeric returns non-zero and the caller falls back to its own schedule.
retry_after_seconds() {
  local raw
  raw="$(sed -n 's/^[Rr]etry-[Aa]fter:[ \t]*//p' "$HDR_FILE" 2>/dev/null | tr -d '\r' | first_n 1)"
  case "$raw" in
    ''|*[!0-9]*) return 1 ;;
  esac
  printf '%s' "$raw"
}

# One curl wrapper for every panel call. The token is delivered through a config
# document on stdin so it never appears in argv: on a shared machine "ps aux" is
# readable by every user, and a panel token in a process listing is a panel token
# in somebody's terminal scrollback and shell history.
#
# Body and headers go to files, so a multi-kilobyte application object never has
# to survive a shell variable and the last response can be printed verbatim when
# something goes wrong. The HTTP status code goes to stdout.
#
# The 429 retry lives HERE rather than in the callers, and that is what makes it
# cover the polling loop as well: a long deploy that trips the rate limiter keeps
# waiting instead of being reported as a failed deployment, and the PATCH,
# read-back and POST sequence get the same protection without repeating it three
# times over.
#
# Every notice printed here goes to stderr deliberately. This function's stdout
# is the HTTP status code, which the caller captures, so anything else written
# there would be spliced into that code.
coolify_api() {
  # $1 = HTTP method, $2 = url, $3 = optional JSON body (empty for GET)
  local method="$1" url="$2" payload="${3-}"
  local code='' attempt=0 wait_seconds

  while :; do
    if [ -n "$payload" ]; then
      code="$(printf 'header = "Authorization: Bearer %s"\nheader = "Content-Type: application/json"\nurl = "%s"\n' \
        "$KOGAION_COOLIFY_TOKEN" "$url" \
        | curl --silent --show-error --location --request "$method" \
               --data "$payload" \
               --dump-header "$HDR_FILE" --output "$BODY_FILE" \
               --write-out '%{http_code}' \
               --config -)" || code=''
    else
      code="$(printf 'header = "Authorization: Bearer %s"\nurl = "%s"\n' "$KOGAION_COOLIFY_TOKEN" "$url" \
        | curl --silent --show-error --location --request "$method" \
               --dump-header "$HDR_FILE" --output "$BODY_FILE" \
               --write-out '%{http_code}' \
               --config -)" || code=''
    fi

    # curl prints nothing at all when the transport fails, and '000' is what the
    # callers already treat as "no verdict", so an empty capture becomes it here.
    [ -n "$code" ] || code='000'

    if [ "$code" != '429' ]; then
      printf '%s' "$code"
      return 0
    fi

    attempt=$(( attempt + 1 ))
    if [ "$attempt" -gt "$KOGAION_429_RETRIES" ]; then
      printf '   WARN  the panel kept answering 429 after %s retries; giving up on this call\n' \
        "$KOGAION_429_RETRIES" >&2
      printf '%s' "$code"
      return 0
    fi

    if wait_seconds="$(retry_after_seconds)"; then
      :
    else
      wait_seconds=$(( 5 * attempt ))
    fi
    if [ "$wait_seconds" -lt 1 ]; then wait_seconds=1; fi
    if [ "$wait_seconds" -gt "$KOGAION_429_MAX_WAIT" ]; then wait_seconds="$KOGAION_429_MAX_WAIT"; fi

    printf '   ..    the panel is rate limiting this call (HTTP 429); waiting %ss and retrying\n' \
      "$wait_seconds" >&2
    sleep "$wait_seconds" || true
  done
}

# Pull a string field out of the JSON in $BODY_FILE. sed rather than jq, because
# jq is not installed on a minimal deploy host and this script has to be runnable
# at 3am on whatever machine happens to be open.
json_string_field() {
  # $1 = key name
  sed -n "s/.*\"$1\":\"\\([^\"]*\\)\".*/\\1/p" "$BODY_FILE" | first_n 1
}

# Pull the deployment uuid out of a POST /api/v1/deploy answer.
#
# The uuid is NESTED. The panel answers
#
#   {"deployments":[{"deployment_uuid":"...","status":"queued", ...}]}
#
# so the value lives at .deployments[0].deployment_uuid and NOT at the top level.
# json_string_field cannot be used on it: that helper matches the first
# "deployment_uuid":"..." anywhere in the document, which on this particular
# response happens to give the right answer and then keeps giving it for the
# wrong reason -- the day the panel adds a second nested object carrying its own
# deployment_uuid, the top level lookup silently starts returning the wrong
# deployment and this script waits on somebody else's build.
#
# The document is flattened to one line first because the panel is free to pretty
# print it, and the match is anchored on the array opening so only a uuid that is
# genuinely the first element of "deployments" can satisfy it. exit on the first
# hit makes "first" mean first rather than last. Empty output means the array is
# absent, empty, or its first element carries no uuid -- the caller turns that
# into a message about the panel accepting a request without creating anything.
json_deployment_uuid() {
  tr -d '\n\r' < "$BODY_FILE" \
    | awk 'match($0, /"deployments"[[:space:]]*:[[:space:]]*\[[[:space:]]*\{[[:space:]]*"deployment_uuid"[[:space:]]*:[[:space:]]*"[^"]*"/) {
             s = substr($0, RSTART, RLENGTH)
             sub(/.*"deployment_uuid"[[:space:]]*:[[:space:]]*"/, "", s)
             sub(/"$/, "", s)
             print s
             exit
           }'
}

# True when the deploy answer carries a "deployments" key at all. It separates
# "the panel returned an array and left it empty" from "the panel returned
# something this script does not recognise", which have different fixes.
deploy_answer_has_deployments_key() {
  grep -q '"deployments"' "$BODY_FILE" 2>/dev/null
}

# Explain a non-2xx from the panel. The most common answers have different causes
# and different fixes, so they get separate text rather than one generic
# "request failed". Writes to stdout; callers redirect it to stderr.
#
# 401 and 403 are NOT the same answer and must not be described as one. 401 means
# the token itself was rejected: missing, wrong, expired or revoked. 403 means the
# token may well be perfectly valid and the panel refused to let it in anyway,
# for one of three reasons that all live under Settings -> Configuration ->
# Advanced: API Access switched OFF, an IP allowlist ("Allowed IPs for API
# Access") that does not contain the caller's IP, or a token whose permission
# does not cover this call. Collapsing them into one paragraph sends the reader
# to create a new token when the token they already hold is fine and the real
# cause is a toggle in the panel.
api_failure_hint() {
  case "$1" in
    401)
      printf 'The panel did not accept the token (401 Unauthorized).\n'
      printf '\n'
      printf '  KOGAION_COOLIFY_TOKEN is missing, wrong, expired or revoked. Create a\n'
      printf '  new one in the panel under Settings -> API Tokens and re-run. Nothing\n'
      printf '  here is about permissions or about API Access: 401 is answered before\n'
      printf '  the panel looks at any of that.\n'
      ;;
    403)
      printf 'The panel refused this token (403 Forbidden). The token is probably fine.\n'
      printf '\n'
      printf '  Check, in the panel, Settings -> Configuration -> Advanced:\n'
      printf '    1. "Enable API Access" must be switched ON. While it is OFF every\n'
      printf '       API call is refused with exactly this status, whatever the token\n'
      printf '       is worth.\n'
      printf '    2. "Allowed IPs for API Access" must be EMPTY for a token used from a\n'
      printf '       GitHub Actions runner. A populated allowlist is the single most\n'
      printf '       common cause of this failure in CI: runner egress addresses are\n'
      printf '       dynamic and different on every run, so an allowlist that was\n'
      printf '       correct yesterday denies today with "You are not allowed to\n'
      printf '       access the API." Leaving the field blank is the supported setup\n'
      printf '       for a CI token.\n'
      printf '    3. The token needs write access for a rollback. A read-only token can\n'
      printf '       list and read but is refused here.\n'
      ;;
    429)
      printf 'The panel is rate limiting this API caller and answered 429. This script\n'
      printf 'honours Retry-After and retries up to %s times per call, so seeing this means\n' "$KOGAION_429_RETRIES"
      printf 'the limit was still exceeded after every retry. Wait a few minutes and re-run.\n'
      printf 'A rollback re-run is safe: it re-reads the current pin first and the write is\n'
      printf 'idempotent, so a run that already landed costs nothing but the deploy it\n'
      printf 'starts -- and a deploy is only started after the pin has been confirmed.\n'
      ;;
    404)
      printf 'The panel does not know that uuid, although it listed it a moment ago. That\n'
      printf 'is rare, and it means one of two things: the resource was deleted in between,\n'
      printf 'or the path is doubled. Check KOGAION_COOLIFY_URL -- if it still ends in\n'
      printf '/api/v1 every path is doubled and nothing resolves. The base must be the\n'
      printf 'panel address with no suffix.\n'
      ;;
    405|422)
      printf 'The panel understood the request and refused its shape. That usually means\n'
      printf 'the resource is not a plain Docker Image resource: rolling this back would mean\n'
      printf 'rewriting a build pipeline, which this script deliberately does not do.\n'
      ;;
    5??)
      printf 'The panel failed on its own side. Do not retry blindly: read the response body\n'
      printf 'printed above, confirm the panel is reachable at %s, and check its logs.\n' "$KOGAION_COOLIFY_URL"
      ;;
    *)
      printf 'Unexpected status from the panel. The response body is printed above; read it,\n'
      printf 'and confirm KOGAION_COOLIFY_URL points at the right panel.\n'
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Resolve the application uuid from the domain it serves.
#
# The panel is asked which application serves COOLIFY_APP_FQDN, and the uuid comes
# from the answer. The call is a plain GET, so nothing is written, and it happens
# here -- before the registry pre-flight and therefore before any write -- so an
# ambiguous or unknown domain is reported while the cheapest possible statement
# is still true: nothing has happened yet.
#
# EXACTLY ONE application must serve the domain. Zero means the domain is not
# deployed on this panel. More than one means the panel cannot tell two resources
# apart by their domain, and choosing between them at 2am is how the wrong site
# gets the wrong build. Both cases print the candidates and stop.
# ---------------------------------------------------------------------------

list_url="$KOGAION_COOLIFY_URL/api/v1/applications"
http_code="$(coolify_api GET "$list_url")" || http_code='000'

if [ "$http_code" != '200' ]; then
  printf '   FAIL  could not list the applications (GET %s answered %s)\n' "$list_url" "$http_code" >&2
  printf '\n   Response body:\n' >&2
  first_n 25 < "$BODY_FILE" | sed 's/^/     /' >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  api_failure_hint "$http_code" >&2
  printf '\n  NOTHING HAS BEEN CHANGED: no field was written and no deploy was\n' >&2
  printf '  started.\n' >&2
  exit 1
fi

# One line per application: uuid, fqdn, name, separated by a pipe. awk rather
# than jq for the same reason json_string_field is sed and not jq -- this script
# has to run on whatever machine happens to be open at 3am.
#
# Braces are put on lines of their own first, so brace depth can tell the
# applications apart from an object nested inside one, and the first uuid and
# fqdn seen at that depth are the ones that belong to the application. The
# separator is a pipe rather than a tab because tab is IFS whitespace: a field
# that is empty would collapse and shift every field after it.
APPS_FILE="$WORK_DIR/applications.psv"
tr -d '\n' < "$BODY_FILE" \
  | sed -e 's/[{]/\n{/g' -e 's/[}]/}\n/g' \
  | awk '
      {
        line = $0
        opens  = gsub(/\{/, "{", line)
        closes = gsub(/\}/, "}", line)
        if (depth == 0) { uuid = ""; fqdn = ""; name = ""; got = 0 }
        depth += opens
        if (depth == 1) {
          if (!got && match(line, /"uuid"[ \t]*:[ \t]*"[^"]*"/)) {
            uuid = substr(line, RSTART, RLENGTH)
            sub(/^"uuid"[ \t]*:[ \t]*"/, "", uuid)
            sub(/"$/, "", uuid)
          }
          if (!got && match(line, /"fqdn"[ \t]*:[ \t]*"[^"]*"/)) {
            fqdn = substr(line, RSTART, RLENGTH)
            sub(/^"fqdn"[ \t]*:[ \t]*"/, "", fqdn)
            sub(/"$/, "", fqdn)
          }
          if (!got && match(line, /"name"[ \t]*:[ \t]*"[^"]*"/)) {
            name = substr(line, RSTART, RLENGTH)
            sub(/^"name"[ \t]*:[ \t]*"/, "", name)
            sub(/"$/, "", name)
          }
          if (uuid != "") got = 1
          if (name != "") gsub(/\|/, " ", name)
        }
        depth -= closes
        if (depth == 0 && got) print uuid "|" fqdn "|" name
      }
    ' > "$APPS_FILE"

if [ ! -s "$APPS_FILE" ]; then
  die 'the panel returned no application to choose from' \
    'The listing was empty, or it was not shaped the way this script reads it. Check KOGAION_COOLIFY_URL: a base that still ends in /api/v1 doubles the path and returns something that is not a list of applications. NOTHING HAS BEEN CHANGED.'
fi

# Lowercased on both sides, because a domain is case-insensitive and the panel
# is free to have stored it either way.
APP_FQDN_LOWER="$(printf '%s' "$COOLIFY_APP_FQDN" | tr '[:upper:]' '[:lower:]')"

# A uuid was passed instead of a domain. Nothing to choose: the caller already named the
# resource, and that is the whole point of accepting the form -- it is the same value the
# CI pipeline is configured with, so there is nothing left that could disagree.
if [ -n "$APP_UUID_DIRECT" ]; then
  APP_UUID="$APP_UUID_DIRECT"
  note "application  $APP_UUID  (taken from COOLIFY_APP_FQDN, which was given as an id)"
  MATCH_COUNT=1
  MATCHES_FILE="$WORK_DIR/matches.psv"
  : > "$MATCHES_FILE"
  printf '%s|%s|%s\n' "$APP_UUID" "" "(identified by id)" >> "$MATCHES_FILE"
  APP_UUID_SOURCE='id given directly'
else
  APP_UUID_SOURCE="discovered from domain $COOLIFY_APP_FQDN"
fi


# The domain form is the only one that has to CHOOSE. The id form already knows.
if [ -z "$APP_UUID_DIRECT" ]; then
  MATCH_COUNT=0
  APP_UUID=''
  MATCHES_FILE="$WORK_DIR/matches.psv"
  : > "$MATCHES_FILE"

  while IFS='|' read -r entry_uuid entry_fqdn entry_name; do
    [ -n "$entry_fqdn" ] || continue
    case "$(printf '%s' "$entry_fqdn" | tr '[:upper:]' '[:lower:]')" in
      *"$APP_FQDN_LOWER"*)
        MATCH_COUNT=$(( MATCH_COUNT + 1 ))
        APP_UUID="$entry_uuid"
        printf '%s|%s|%s\n' "$entry_uuid" "$entry_fqdn" "$entry_name" >> "$MATCHES_FILE"
        ;;
    esac
  done < "$APPS_FILE"
fi


if [ "$MATCH_COUNT" -eq 0 ]; then
  printf '   FAIL  no Coolify application serves %s\n' "$COOLIFY_APP_FQDN" >&2
  printf '\n   Applications the panel knows:\n' >&2
  awk -F'|' '{ printf "     - %s: %s\n", $3, ($2 == "" ? "(no domain)" : $2) }' "$APPS_FILE" >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  NOTHING HAS BEEN CHANGED: no field was written and no deploy was\n' >&2
  printf '  started.\n' >&2
  printf '\n  %s is either not deployed on this panel, or deployed under a\n' "$COOLIFY_APP_FQDN" >&2
  printf '  different domain than the one passed here. Compare the two lists and\n' >&2
  printf '  re-run with the domain the application actually serves -- the one the\n' >&2
  printf '  browser shows, with no https:// and no path.\n' >&2
  exit 1
fi

if [ "$MATCH_COUNT" -ne 1 ]; then
  printf '   FAIL  %s Coolify applications serve %s\n' "$MATCH_COUNT" "$COOLIFY_APP_FQDN" >&2
  printf '\n   The domain does not tell them apart:\n' >&2
  awk -F'|' '{ printf "     - %s [%s] %s\n", $3, $1, $2 }' "$MATCHES_FILE" >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  NOTHING HAS BEEN CHANGED: no field was written and no deploy was\n' >&2
  printf '  started.\n' >&2
  printf '\n  This project runs ONE resource: a single Docker Image application on\n' >&2
  printf '  the one project domain. A second match means a second resource was\n' >&2
  printf '  created on that same domain, and from out here there is nothing left\n' >&2
  printf '  to tell them apart by -- choosing wrong rewrites the pin and deploys\n' >&2
  printf '  the wrong site. This script stops at 2 matches on purpose, so that a\n' >&2
  printf '  second resource turns into an explicit stop instead of a coin flip.\n' >&2
  printf '  Resolve it in the panel: keep the resource that serves the domain and\n' >&2
  printf '  remove the other, or give the second one its own domain.\n' >&2
  exit 1
fi

# The uuid is now interpolated into a URL and into a JSON body, exactly as the
# operator-supplied one used to be. It comes from the panel rather than from a
# clipboard, which is strictly better, but "strictly better" is not "provably
# well formed", so the same character set is required of it.
# Coolify public ids are SHORT LOWERCASE ALPHANUMERIC strings, roughly 26 characters
# (319uac7occnbhmn7eui9h0wt), NOT the 36-character hex-with-dashes form of a UUIDv4.
# A length check written out of UUID habit would therefore reject every id the panel
# actually issues, and the rollback would fail on a perfectly good resource.
#
# What actually matters is that the value is safe to interpolate into a URL and a JSON
# body, and is long enough not to be a stray word. Character class plus a generous upper
# bound covers both without asserting a length the panel does not guarantee.
case "$APP_UUID" in
  *[!a-z0-9]*|'')
    printf '   FAIL  this is not a shape this script will use as an application id: %s\n' "$APP_UUID" >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    printf '  Coolify ids are lowercase letters and digits, e.g.\n' >&2
    printf '  319uac7occnbhmn7eui9h0wt\n' >&2
    printf '  Copy it out of the application page URL in the panel rather than typing it.\n' >&2
    printf '  NOTHING HAS BEEN CHANGED.\n' >&2
    exit 1
    ;;
esac

if [ "${#APP_UUID}" -lt 8 ] || [ "${#APP_UUID}" -gt 40 ]; then
  printf '   FAIL  the application id is %s characters long: %s\n' "${#APP_UUID}" "$APP_UUID" >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  Coolify ids run to about 26 characters. A much shorter value is usually a\n' >&2
  printf '  truncated copy. Open the application in the panel and copy the id from\n' >&2
  printf '  that page URL. NOTHING HAS BEEN CHANGED.\n' >&2
  exit 1
fi

note "panel        $KOGAION_COOLIFY_URL"
note "application  $APP_UUID  (discovered from domain $COOLIFY_APP_FQDN)"
note "image        $IMAGE"
case "$TARGET_KIND" in
  digest) note "rollback to  $TARGET_DIGEST (given directly as a digest)" ;;
  tag)    note "rollback to  :$TARGET (an immutable commit tag, not yet resolved)" ;;
esac
note "dry run      $DRY_RUN"
# Printed here rather than at the point of stripping, because the output helpers
# are defined further down and calling them earlier aborts the script.
if [ "$REF_RECOGNISED" = 'yes' ]; then
  note "ROLLBACK_TO named the repository $REF_REPO, which matches IMAGE"
fi

# The pre-flight below needs a docker CLI with registry credentials, because
# resolving a reference is a registry operation and "docker manifest inspect" is
# the one tool that already knows where this account's credential lives. A
# missing CLI has to be reported as a missing CLI: without this check the
# pre-flight would fail and report the rollback target as nonexistent, which is
# a confident and completely wrong answer to give during an incident.
if ! command -v docker >/dev/null 2>&1; then
  die 'the docker CLI is not on PATH'     'The registry pre-flight needs it, and this host is where the deployment pulls, so install Docker here or re-run this script on the machine that actually runs the containers. Nothing has been changed in the panel.'
fi

# ===========================================================================
say '1. pre-flight: does the rollback target exist in the registry'
# ===========================================================================
#
# This runs BEFORE any panel call that writes anything. Pinning a resource to an
# image that cannot be pulled converts a five second mistake into an outage, and
# the failure surfaces much later, in a deploy log, at the worst possible moment.

if [ "$TARGET_KIND" = 'digest' ]; then
  TARGET_REF="$IMAGE@$TARGET_DIGEST"
else
  TARGET_REF="$IMAGE:$TARGET"
fi

note "resolving $TARGET_REF"
note "this uses the credentials in this account's Docker config, so run it on the"
note 'deploy host, or anywhere "docker login ghcr.io" has been done for this account'

if docker manifest inspect "$TARGET_REF" >/dev/null 2>"$ERR_FILE"; then
  note 'the registry has this reference'
else
  registry_error="$(first_n 5 < "$ERR_FILE")"
  printf '   FAIL  the registry cannot resolve %s\n' "$TARGET_REF" >&2
  if [ -n "$registry_error" ]; then
    printf '\n   The registry said:\n' >&2
    printf '%s\n' "$registry_error" | sed 's/^/     /' >&2
  fi
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  NOTHING HAS BEEN CHANGED: no panel field was touched and no deploy was\n' >&2
  printf '  started.\n\n' >&2
  if [ "$TARGET_KIND" = 'tag' ]; then
    printf '  The tag %s does not exist for %s.\n' "$TARGET" "$IMAGE" >&2
    printf '\n  Likely causes, in order:\n' >&2
    printf '    1. That commit was never built. CI publishes an immutable tag per\n' >&2
    printf '       commit, but only for runs that got as far as the push. Check the\n' >&2
    printf '       Actions tab for that commit sha.\n' >&2
    printf '    2. The sha is wrong. A truncated or abbreviated sha produces exactly\n' >&2
    printf '       this. Copy the full 40 characters from git log or the Actions page.\n' >&2
    printf '    3. The package is private and this machine cannot read it. Run\n' >&2
    printf '       login-registry.sh on THIS machine first.\n' >&2
  else
    printf '  The digest %s does not exist for %s.\n' "$TARGET_DIGEST" "$IMAGE" >&2
    printf '\n  Likely causes, in order:\n' >&2
    printf '    1. It is a PLATFORM manifest digest rather than the index digest. For\n' >&2
    printf '       a multi-platform build those are different values, and only the\n' >&2
    printf '       index digest is usable as a pull reference.\n' >&2
    printf '    2. It is not a digest at all but a truncated copy of one.\n' >&2
    printf '    3. The package is private and this machine cannot read it.\n' >&2
  fi
  printf '\n  List what is actually published:\n' >&2
  printf '    REGISTRY_USERNAME=... REGISTRY_TOKEN=... bash login-registry.sh\n' >&2
  exit 1
fi

# ===========================================================================
say '2. resolve the target to the digest that will be pinned'
# ===========================================================================

if [ "$TARGET_KIND" = 'digest' ]; then
  PIN_DIGEST="$TARGET_DIGEST"
  note "already a digest, nothing to resolve: $PIN_DIGEST"
else
  note "resolving $IMAGE:$TARGET to a digest"

  resolved=''

  # Preferred path: buildx reports the digest of the image INDEX without
  # downloading a single layer, which is both fast and exactly the value CI
  # publishes and the panel pins. buildx is a plugin, so its absence is normal and
  # must not be fatal.
  if docker buildx version >/dev/null 2>&1; then
    note 'buildx is available; asking it for the index digest'
    resolved="$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$TARGET_REF" 2>/dev/null | first_n 1)" || resolved=''
    if valid_sha256_hex "${resolved#sha256:}"; then
      note 'got the index digest from buildx'
    else
      resolved=''
    fi
  else
    note 'buildx is not installed; falling back to a pull'
  fi

  # Fallback: pull the image and read RepoDigests. This costs a download, which
  # for a rollback target is usually a no-op because those layers are already on
  # the server from the build being replaced. In exchange it works on any host
  # with a plain docker CLI, and it doubles as proof that this machine can
  # actually PULL the image, which is what the deploy is about to do.
  if [ -z "$resolved" ]; then
    if docker pull --quiet "$TARGET_REF" >/dev/null 2>"$ERR_FILE"; then
      note "pulled $TARGET_REF; reading the digest from the local image"
      pulled_ref="$(docker inspect --format '{{index .RepoDigests 0}}' "$TARGET_REF" 2>/dev/null || true)"
      pulled_ref="${pulled_ref##*@}"
      if valid_sha256_hex "${pulled_ref#sha256:}"; then
        resolved="$pulled_ref"
      fi
    else
      printf '   FAIL  could not pull %s either\n' "$TARGET_REF" >&2
      first_n 5 < "$ERR_FILE" | sed 's/^/     /' >&2
      printf '\nWHAT TO DO NEXT:\n' >&2
      printf '  The reference passed the manifest check but cannot be pulled, so the\n' >&2
      printf '  credentials on THIS machine can read the manifest but not the layers.\n' >&2
      printf '  Run login-registry.sh here first. NOTHING HAS BEEN CHANGED in the panel.\n' >&2
      exit 1
    fi
  fi

  if ! valid_sha256_hex "${resolved#sha256:}"; then
    die "could not determine the digest for $TARGET_REF" \
      'The image resolves but its digest could not be read from either buildx or the local image. Get the digest by running login-registry.sh with TAG set to this tag, then pass that digest to ROLLBACK_TO instead. NOTHING HAS BEEN CHANGED in the panel.'
  fi

  PIN_DIGEST="$resolved"
fi

PIN_HEX="${PIN_DIGEST#sha256:}"

printf '\n   Rollback target\n\n'
printf '     requested     %s\n' "$ROLLBACK_TO"
printf '     image         %s\n' "$IMAGE"
printf '     Docker form   %s@%s\n' "$IMAGE" "$PIN_DIGEST"
printf '     Coolify form  sha256-%s\n' "$PIN_HEX"
printf '\n'
printf '     The value written into docker_registry_image_tag is the Coolify form: a\n'
printf '     HYPHEN and no colon. That is how the panel stores a digest today, so the\n'
printf '     write does not change the shape of the field, only its value.\n'
printf '\n'

# ===========================================================================
say '3. what is pinned right now'
# ===========================================================================

app_url="$KOGAION_COOLIFY_URL/api/v1/applications/$APP_UUID"
http_code="$(coolify_api GET "$app_url")" || http_code='000'

if [ "$http_code" != '200' ]; then
  printf '   FAIL  could not read the application (GET %s answered %s)\n' "$app_url" "$http_code" >&2
  printf '\n   Response body:\n' >&2
  first_n 25 < "$BODY_FILE" | sed 's/^/     /' >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  api_failure_hint "$http_code" >&2
  printf '\n  NOTHING HAS BEEN CHANGED.\n' >&2
  exit 1
fi

CURRENT_NAME="$(json_string_field docker_registry_image_name)"
CURRENT_TAG="$(json_string_field docker_registry_image_tag)"

printf '\n'
note "docker_registry_image_name  : $CURRENT_NAME"
note "docker_registry_image_tag   : $CURRENT_TAG"
note "docker_registry_image_digest : $(json_string_field docker_registry_image_digest)"
printf '\n'

if [ -z "$CURRENT_TAG" ]; then
  die 'the panel reported no docker_registry_image_tag for this resource' \
    'That means the resource is not a plain Docker Image resource, so pinning it by digest does not apply to it. Check the resource type in the panel. NOTHING HAS BEEN CHANGED.'
fi

# The field legitimately holds a tag if somebody has been pinning by hand, and
# this script is about to replace that with a digest. Say so out loud, because
# the shape of that value changing should never be a surprise.
case "$CURRENT_TAG" in
  sha256-*) : ;;
  *)
    warn "the current pin is a TAG ($CURRENT_TAG), not a digest."
    warn 'After this script runs it will be a DIGEST, which is the convention CI uses'
    warn 'and the one that makes the running build identifiable. Coolify renders such'
    warn 'a digest into the compose file it generates as image@sha256:<hex>.'
    ;;
esac

CURRENT_HEX="$(normalize_digest_hex "$CURRENT_TAG")"

if [ "$CURRENT_HEX" = "$PIN_HEX" ]; then
  printf '   ..    the panel is ALREADY pinned to the rollback target.\n\n'
  printf '   Nothing needs changing. The deploy below is still started, because the\n'
  printf '   resource can be pinned correctly while the RUNNING container is an older\n'
  printf '   image -- a deploy can fail after the pin was written. To see what is\n'
  printf '   actually running:\n'
  printf '     EXPECTED_DIGEST=sha256-%s bash verify-deploy.sh\n\n' "$PIN_HEX"
fi

# ===========================================================================
# Everything above this line was read-only. --dry-run stops here, before the
# first write of any kind.
# ===========================================================================

# ===========================================================================
# Everything above this line was read-only. --dry-run stops here, before the
# first write of any kind.
# ===========================================================================


# ===========================================================================
if [ "$DRY_RUN" = 'yes' ]; then
  say 'dry run: nothing was changed'
  printf '   The application was identified, not configured by this script yet%s\n' "$APP_UUID_SOURCE"
  printf '   and the target digest was resolved from the registry. What it WOULD do:\n\n'
  printf '     1. PATCH %s\n' "$app_url"
  printf '          docker_registry_image_name = %s\n' "$IMAGE"
  printf '          docker_registry_image_tag  = sha256-%s\n' "$PIN_HEX"
  printf '        (currently: %s)\n' "$CURRENT_TAG"
  printf '\n'
  printf '     2. GET   %s\n' "$app_url"
  printf '          read back, to prove the PATCH landed. If it did not, the script stops\n'
  printf '          here with NO deploy started -- production is untouched.\n'
  printf '\n'
  printf '     3. POST   %s/api/v1/deploy\n' "$KOGAION_COOLIFY_URL"
  printf '          {"uuid":"%s","force":false}\n' "$APP_UUID"
  printf '\n'
  printf '     4. Poll   %s/api/v1/deployments/<deployment_uuid>\n' "$KOGAION_COOLIFY_URL"
  printf '          until the status is finished, failed or cancelled-by-user, or %s\n' "$POLL_TIMEOUT"
  printf '          seconds elapse. Note the plural in 'deployments', and note that\n'
  printf '          'successful' and 'cancelled' are NOT Coolify states.\n'
  printf '\n'
  printf '   No field was written and no deployment was started.\n'
  printf '   Run the same command without --dry-run to carry it out.\n'
  exit 0
fi

# ===========================================================================
say '4. pinning the resource to the rollback digest'
# ===========================================================================

# TWO FIELDS, AND ONLY TWO.
#
# `instant_deploy` is deliberately absent. The PATCH endpoint accepts it, and it
# DOES start a deployment -- but the answer is then just {"uuid": "<app-uuid>"}
# with no deployment_uuid in it, so there is nothing to poll and no way to learn
# whether the run succeeded. Use the explicit POST in section 6 instead.
#
# `build_pack` is deliberately absent too. Its documented enum is
# nixpacks|railpack|static|dockerfile|dockercompose and does not include
# dockerimage, so sending it risks a validation rejection on a resource whose
# type was never in question.
#
# Every value below has already been restricted to a safe character set by the
# checks at the top, which is why there is no JSON escaping step here.
PAYLOAD="{\"docker_registry_image_name\":\"$IMAGE\",\"docker_registry_image_tag\":\"sha256-$PIN_HEX\"}"

http_code="$(coolify_api PATCH "$app_url" "$PAYLOAD")" || http_code='000'

case "$http_code" in
  200|204)
    note "the panel accepted the change (HTTP $http_code)"
    ;;
  *)
    printf '   FAIL  the panel refused the change (HTTP %s)\n' "$http_code" >&2
    printf '\n   Response body:\n' >&2
    first_n 25 < "$BODY_FILE" | sed 's/^/     /' >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    api_failure_hint "$http_code" >&2
    printf '\n  Nothing was pinned and no deploy was started; the resource is still\n' >&2
    printf '  on %s. If the panel refuses to change this field through the API, set it\n' "$CURRENT_TAG" >&2
    printf '  by hand under Configuration -> General -> Image Tag to sha256-%s and\n' "$PIN_HEX" >&2
    printf '  press Redeploy. Do not abandon this script until you know why the write\n' >&2
    printf '  was refused.\n' >&2
    exit 1
    ;;
esac

# ===========================================================================
say '5. proving the write actually landed'
# ===========================================================================
#
# A PATCH that returns 200 is a request that was accepted, not a change that
# happened. The panel can accept the request and then validate, revert or ignore
# the field -- and a rollback that silently did nothing is worse than no
# rollback, because it is believed to have worked. So the value is read back and
# compared BEFORE anything is deployed.

http_code="$(coolify_api GET "$app_url")" || http_code='000'
if [ "$http_code" != '200' ]; then
  die "the re-read after the write failed (GET $app_url answered $http_code)" \
    "The PATCH was accepted but the field cannot be read back, so whether it landed is unknown. Check the panel by hand before doing anything else: Configuration -> General -> Image Tag. If it already reads sha256-$PIN_HEX the write succeeded and you only need to press Redeploy. NOTHING ELSE HAS RUN: no deployment was started."
fi

CONFIRMED_TAG="$(json_string_field docker_registry_image_tag)"
CONFIRMED_HEX="$(normalize_digest_hex "$CONFIRMED_TAG")"

printf '\n'
note "docker_registry_image_name : $(json_string_field docker_registry_image_name)"
note "docker_registry_image_tag  : $CONFIRMED_TAG"
printf '\n'

if [ "$CONFIRMED_HEX" != "$PIN_HEX" ]; then
  printf '   FAIL  the write did NOT land.\n' >&2
  printf '\n' >&2
  printf '   The panel accepted the PATCH, but the field still reads:\n' >&2
  printf '     %s\n' "$CONFIRMED_TAG" >&2
  printf '   while it was asked to read:\n' >&2
  printf '     sha256-%s\n' "$PIN_HEX" >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  NO DEPLOYMENT WAS STARTED, so production is untouched and still serving\n' >&2
  printf '  whatever it was serving before this script ran. That is exactly why this\n' >&2
  printf '  check happens here rather than after the deploy.\n' >&2
  printf '\n' >&2
  printf '  How a panel can accept and discard a write like this:\n' >&2
  printf '    - a concurrent deploy or queue worker rewrote the field from its own\n' >&2
  printf '      copy of the resource between the write and the read;\n' >&2
  printf '    - the resource is managed by a build pipeline rather than a fixed image,\n' >&2
  printf '      and the pipeline reasserts its own tag on every deploy;\n' >&2
  printf '    - the field is locked or ignored for this resource type.\n' >&2
  printf '\n' >&2
  printf '  Find out which: open Configuration -> General in the panel, read Image Tag,\n' >&2
  printf '  and check whether the resource is defined by a pipeline. Then either fix the\n' >&2
  printf '  pin by hand in the panel and press Redeploy, or stop and reconcile the two\n' >&2
  printf '  systems before deploying again.\n' >&2
  exit 1
fi

note 'confirmed: the resource is pinned to the rollback digest'

# ===========================================================================
say '6. starting the deployment'
# ===========================================================================

deploy_url="$KOGAION_COOLIFY_URL/api/v1/deploy"
deploy_payload="{\"uuid\":\"$APP_UUID\",\"force\":false}"

note "POST $deploy_url"
http_code="$(coolify_api POST "$deploy_url" "$deploy_payload")" || http_code='000'

case "$http_code" in
  200|201) : ;;
  *)
    printf '   FAIL  the deploy endpoint answered %s\n' "$http_code" >&2
    printf '\n   Response body:\n' >&2
    first_n 25 < "$BODY_FILE" | sed 's/^/     /' >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    api_failure_hint "$http_code" >&2
    printf '\n' >&2
    printf '  The pin DID land: the resource is on sha256-%s. Only the deploy did not\n' "$PIN_HEX" >&2
    printf '  start, so production is unchanged for now. Trigger it from the panel by\n' >&2
    printf '  pressing Redeploy, or re-run this script: the pin is already correct, so\n' >&2
    printf '  the re-run is a no-op write followed by a deploy.\n' >&2
    exit 1
    ;;
esac

# THE ANSWER IS NESTED.
#
# Coolify answers with {"deployments": [{"deployment_uuid": "..."}]}. Reading
# `deployment_uuid` from the top level yields null. Worse, a flat scan of the
# document returns the right answer for the wrong reason and silently latches
# onto the wrong deployment the day the panel emits a second nested id.
DEPLOYMENT_UUID="$(json_deployment_uuid)"

if [ -z "$DEPLOYMENT_UUID" ]; then
  array_state='absent'
  if deploy_answer_has_deployments_key; then array_state='present but empty'; fi
  printf '   FAIL  the deploy call succeeded (HTTP %s) but returned no deployment_uuid\n' "$http_code" >&2
  printf '\n' >&2
  printf '   The deployments array is: %s\n' "$array_state" >&2
  printf '\nWHAT THIS MEANS:\n' >&2
  printf '  The panel ACCEPTED the request but created NO deployment. That is not the\n' >&2
  printf '  same thing as a deployment that failed, and the difference matters: nothing\n' >&2
  printf '  is running that was not running before.\n' >&2
  printf '\nWHAT TO DO NEXT:\n' >&2
  printf '  Do NOT re-run this script yet: every run queues another deployment.\n' >&2
  printf '  1. Open the Deployments tab and look for a run that started a moment ago.\n' >&2
  printf '  2. If none is there, the pin landed and only the trigger failed. Press\n' >&2
  printf '     Redeploy in the panel, or re-run this script.\n' >&2
  printf '  3. If the panel answers this way repeatedly, check that API Access is ON at\n' >&2
  printf '     Settings > Configuration > Advanced and that the token still has the\n' >&2
  printf '     deploy permission.\n' >&2
  first_n 25 < "$BODY_FILE" | sed 's/^/     /' >&2
  exit 1
fi

note "deployment_uuid $DEPLOYMENT_UUID"
note "watch it in the panel at $KOGAION_COOLIFY_URL/deployments/$DEPLOYMENT_UUID"
note 'force is false, so an already running deployment is not torn down and restarted;'
note 'if one is in flight this may queue behind it rather than replace it'

# ===========================================================================
say '7. waiting for the deployment to finish'
# ===========================================================================
#
# The script waits rather than returning immediately, because a rollback that
# reports success and then fails during the pull is the worst possible outcome:
# the operator has already told everyone the old build is back.
#
# THREE THINGS about the contract, each one a trap if assumed otherwise:
#
#   - the endpoint is /api/v1/deployments/{uuid}, PLURAL. The singular spelling
#     404s, and the polling loop then looks exactly like a hung deployment.
#   - the terminal states are finished, failed and cancelled-by-user. There is
#     NO 'successful' and NO 'cancelled' in Coolify's enum. A poller waiting for
#     'successful' never exits, burns the whole timeout, and reports failure for a
#     deployment that finished correctly -- after which an operator who re-runs it
#     has started a second deployment on top of the first.
#   - queued and in_progress are NOT terminal. Anything unrecognised keeps
#     polling until the timeout rather than being optimistically read as either
#     outcome.

deployment_url="$KOGAION_COOLIFY_URL/api/v1/deployments/$DEPLOYMENT_UUID"
elapsed=0
final_status=''
status='(not polled yet)'

while :; do
  http_code="$(coolify_api GET "$deployment_url")" || http_code='000'

  if [ "$http_code" = '200' ]; then
    status="$(json_string_field status)"
    [ -n "$status" ] || status='(the panel reported no status field)'
  elif [ "$http_code" = '404' ]; then
    status='not-found'
  else
    # A 000 here is a transport problem rather than a verdict on the deployment,
    # so it does not break the loop: it keeps polling and the timeout decides.
    status="http-$http_code"
  fi

  note "t+${elapsed}s  $status"

  case "$status" in
    finished)
      final_status='finished'
      break
      ;;
    failed|cancelled-by-user)
      final_status="$status"
      break
      ;;
  esac

  if [ "$elapsed" -ge "$POLL_TIMEOUT" ]; then
    final_status='timed-out'
    break
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$(( elapsed + POLL_INTERVAL ))
done

printf '\n'

case "$final_status" in
  finished)
    printf '   OK    the deployment finished with status %s\n' "$final_status"
    ;;
  timed-out)
    printf '   FAIL  no terminal status after %s seconds (last seen: %s)\n' "$POLL_TIMEOUT" "$status" >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    printf '  The deploy may still be running, or it may be stuck. Do NOT re-run this\n' >&2
    printf '  script and do NOT re-pin: the pin already landed, and a second run would\n' >&2
    printf '  queue a second deployment.\n' >&2
    printf '\n' >&2
    printf '  1. Open the deployment in the panel and read its log:\n' >&2
    printf '       %s/deployments/%s\n' "$KOGAION_COOLIFY_URL" "$DEPLOYMENT_UUID" >&2
    printf '  2. If it is progressing, wait. A cold host pulling a fresh image can take\n' >&2
    printf '     several minutes with no log output at all.\n' >&2
    printf '  3. If it is stuck, raise the ceiling and re-run JUST the wait:\n' >&2
    printf '       POLL_TIMEOUT=3600 bash rollback.sh\n' >&2
    printf '  4. Only once the log shows a failure should you consider a different\n' >&2
    printf '     rollback target.\n' >&2
    exit 1
    ;;
  http-4*|not-found)
    printf '   FAIL  the deployment status could not be read (%s)\n' "$final_status" >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    printf '  Read the deployment in the panel instead:\n' >&2
    printf '    %s/deployments/%s\n' "$KOGAION_COOLIFY_URL" "$DEPLOYMENT_UUID" >&2
    printf '  The pin DID land, so the intended build is queued or running and only\n' >&2
    printf '  this script lost sight of it. Re-running with a larger POLL_TIMEOUT\n' >&2
    printf '  reattaches to it, but only if you know it is still running.\n' >&2
    exit 1
    ;;
  *)
    printf '   FAIL  the deployment ended with status %s\n' "$final_status" >&2
    printf '\nWHAT TO DO NEXT:\n' >&2
    printf '  The deploy ran and failed. The pin to sha256-%s DID land, so the resource\n' "$PIN_HEX" >&2
    printf '  is configured for the rollback target even though nothing is running from\n' >&2
    printf '  it. That asymmetry is deliberate, and it is why this script checks the pin\n' >&2
    printf '  separately from the deploy.\n' >&2
    printf '\n' >&2
    printf '  1. Read the deploy log, which carries the actual error:\n' >&2
    printf '       %s/deployments/%s\n' "$KOGAION_COOLIFY_URL" "$DEPLOYMENT_UUID" >&2
    printf '  2. "unauthorized" means the deploy host has no usable ghcr.io credential:\n' >&2
    printf '     run login-registry.sh there, as the user Coolify SSHes as.\n' >&2
    printf '  3. "manifest unknown" means the image is not where the panel expects it:\n' >&2
    printf '     check IMAGE (currently %s) against the name CI publishes.\n' "$IMAGE" >&2
    printf '  4. A health check failure is not a rollback failure: a panel can roll a\n' >&2
    printf '     deploy back automatically when its own health check fails.\n' >&2
    printf '  5. Do not re-run this script until you know the cause; every run starts a\n' >&2
    printf '     new deployment.\n' >&2
    exit 1
    ;;
esac

# ===========================================================================
say 'verdict'
# ===========================================================================

printf '\n'
printf '  The resource is pinned to sha256-%s\n' "$PIN_HEX"
printf '  The deployment finished, and it is a rollback of %s\n' "$TARGET"
printf '\n'
printf '  PROVE IT, right now, before anyone else does:\n'
printf '\n'
printf '    EXPECTED_DIGEST=sha256-%s \\\n' "$PIN_HEX"
printf '    HEALTH_URL=https://kogaionacademy.ro/api/health \\\n'
printf '    bash docs/ghcr-coolify/scripts/verify-deploy.sh\n'
printf '\n'
printf '  Three things said explicitly, because each has cost somebody an hour:\n'
printf '\n'
printf '  1. DO NOT RUN CI IMMEDIATELY AFTER A ROLLBACK.\n'
printf '     Any push pins the resource back to the new digest and erases the\n'
printf '     evidence. Check the site with verify-deploy.sh FIRST.\n'
printf '\n'
printf '  2. COMMIT THE FIX, NOT THE REVERT OF THE PANEL.\n'
printf '     If you rolled back to buy time, the decision belongs in git, not in a\n'
printf '     dashboard field that nobody sees in a diff.\n'
printf '\n'
printf '  3. THE sha- TAGS SURVIVE.\n'
printf '     You can always come back to an older version, however old. That is\n'
printf '     why they are kept -- and why pruning them is a deliberate act with\n'
printf '     eyes open, not a cron job.\n'
printf '\n'