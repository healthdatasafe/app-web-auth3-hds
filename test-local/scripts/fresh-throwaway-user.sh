#!/usr/bin/env bash
# Register a unique throwaway user on the demo Pryv core and print credentials.
# Lets you exercise login / change-password / authorization flows without
# burning the real test accounts.
#
# Usage:
#   test-local/scripts/fresh-throwaway-user.sh
#
# Output (multi-line, parseable):
#   username: tauth26050614281234
#   password: TestAuth26050614281234!
#   email:    perkiz+tauth26050614281234@gmail.com
#   apiEndpoint: https://demo.datasafe.dev/tauth26050614281234/

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required (brew install jq)." >&2
  exit 1
fi

STAMP=$(date +%y%m%d%H%M%S)
USERNAME="tauth${STAMP}"
PASSWORD="TestAuth${STAMP}!"
EMAIL="perkiz+${USERNAME}@gmail.com"

# Look up an availableCore from /reg/hostings (any first one is fine for demo —
# demo only has the default 'ch1' hosting today).
HOSTINGS=$(curl -sf 'https://demo.datasafe.dev/reg/hostings')
HOSTING_KEY=$(echo "$HOSTINGS" | jq -r '
  [ .regions[] | .zones[] | .hostings | to_entries[] | select(.value.available == true) | .key ][0]
')
AVAILABLE_CORE=$(echo "$HOSTINGS" | jq -r --arg k "$HOSTING_KEY" '
  [ .regions[] | .zones[] | .hostings[$k] | .availableCore ][0]
')

PAYLOAD=$(jq -n \
  --arg appId "test-throwaway-register" \
  --arg username "$USERNAME" \
  --arg password "$PASSWORD" \
  --arg email "$EMAIL" \
  --arg hosting "$HOSTING_KEY" \
  '{appId: $appId, username: $username, password: $password, email: $email, hosting: $hosting, language: "en", invitationToken: "enjoy"}')

RESPONSE=$(curl -sf -X POST "${AVAILABLE_CORE%/}/users" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

API_ENDPOINT=$(echo "$RESPONSE" | jq -r '.apiEndpoint // empty')
if [ -z "$API_ENDPOINT" ]; then
  echo "ERROR: registration failed. Response:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "username: $USERNAME"
echo "password: $PASSWORD"
echo "email:    $EMAIL"
echo "apiEndpoint: $API_ENDPOINT"
