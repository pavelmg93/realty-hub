#!/bin/bash
# Create a new agent account via the signup API.
# Usage: ./scripts/create_agent.sh <username> <first_name> <password> [phone] [email]
#
# Example:
#   ./scripts/create_agent.sh dean Dean password123 0868331111 dean@example.com

set -e

HOST="${WEB_HOST:-localhost}"
PORT="${WEB_PORT:-3000}"
BASE_URL="http://${HOST}:${PORT}"

USERNAME="${1:?Usage: create_agent.sh <username> <first_name> <password> [phone] [email]}"
FIRST_NAME="${2:?Usage: create_agent.sh <username> <first_name> <password> [phone] [email]}"
PASSWORD="${3:?Usage: create_agent.sh <username> <first_name> <password> [phone] [email]}"
PHONE="${4:-}"
EMAIL="${5:-}"

echo "Creating agent: ${USERNAME} (${FIRST_NAME})"
echo "Target: ${BASE_URL}/api/auth/signup"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${USERNAME}\",
    \"first_name\": \"${FIRST_NAME}\",
    \"password\": \"${PASSWORD}\",
    \"phone\": \"${PHONE}\",
    \"email\": \"${EMAIL}\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$ d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "Agent created successfully!"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "Error (HTTP ${HTTP_CODE}):"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi
