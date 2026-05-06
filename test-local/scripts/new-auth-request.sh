#!/usr/bin/env bash
# Create a fresh Pryv auth request via the demo (or prod) register service
# and print the local-dev URL the popup would normally open.
#
# Usage:
#   test-local/scripts/new-auth-request.sh                          # default scenario (basic-diary-read)
#   test-local/scripts/new-auth-request.sh <scenario-name>          # named scenario from fixtures/scenarios.json
#   test-local/scripts/new-auth-request.sh --service prod <scenario-name>
#
# Output (single line, copy-paste to the browser):
#   https://auth.backloop.dev:4443/access/auth?lang=...&key=...&...
#
# Prereq: vite dev server running (npm run dev), demo or prod Pryv core reachable, jq installed.

set -euo pipefail

scriptsFolder=$(cd "$(dirname "$0")"; pwd)
repoRoot=$(cd "$scriptsFolder/../.."; pwd)
fixtures="$repoRoot/test-local/fixtures/scenarios.json"

SERVICE="dev"
SCENARIO="basic-diary-read"

while [ $# -gt 0 ]; do
  case "$1" in
    --service)
      SERVICE="$2"; shift 2 ;;
    --service=*)
      SERVICE="${1#*=}"; shift ;;
    -h|--help)
      sed -n '2,/^$/p' "$0" | sed 's/^# //; s/^#//'
      exit 0 ;;
    *)
      SCENARIO="$1"; shift ;;
  esac
done

case "$SERVICE" in
  dev)  REG_BASE='https://demo.datasafe.dev/reg' ;;
  prod) REG_BASE='https://reg.api.datasafe.dev' ;;
  *) echo "ERROR: --service must be 'dev' or 'prod' (got '$SERVICE')." >&2; exit 1 ;;
esac

if [ ! -f "$fixtures" ]; then
  echo "ERROR: fixtures file not found: $fixtures" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required (brew install jq)." >&2
  exit 1
fi

PAYLOAD=$(jq --arg name "$SCENARIO" '
  .[] | select(.name == $name) | del(._doc, .name)
' "$fixtures")
if [ -z "$PAYLOAD" ]; then
  echo "ERROR: scenario '$SCENARIO' not found in $fixtures." >&2
  echo "Available scenarios:" >&2
  jq -r '.[].name | "  - " + .' "$fixtures" >&2
  exit 1
fi

RESPONSE=$(curl -sf -X POST "$REG_BASE/access" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")
if [ -z "$RESPONSE" ]; then
  echo "ERROR: empty response from $REG_BASE/access — service unreachable?" >&2
  exit 1
fi

KEY=$(echo "$RESPONSE" | jq -r '.key')
POLL=$(echo "$RESPONSE" | jq -r '.poll')
LANG=$(echo "$RESPONSE" | jq -r '.lang // "en"')
APP_ID=$(echo "$RESPONSE" | jq -r '.requestingAppId')
RETURN_URL=$(echo "$RESPONSE" | jq -r '.returnURL // empty')
SERVICE_INFO_URL="$REG_BASE/service/info"

# URL-encode helper (python is universally present on macOS / Linux)
urlencode() {
  python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

QUERY="lang=${LANG}&key=${KEY}&requestingAppId=${APP_ID}"
QUERY="${QUERY}&poll=$(urlencode "$POLL")"
QUERY="${QUERY}&poll_rate_ms=1000"
QUERY="${QUERY}&serviceInfo=$(urlencode "$SERVICE_INFO_URL")"
if [ -n "$RETURN_URL" ]; then
  QUERY="${QUERY}&returnURL=$(urlencode "$RETURN_URL")"
fi

echo "https://auth.backloop.dev:4443/access/auth?${QUERY}"
