#!/bin/bash
# scripts/create_agent.sh — Create a new Realty Hub agent account
# Usage: ./scripts/create_agent.sh <username> <first_name> <last_name> <password> [phone] [email]
#
# PORT env var controls which port to call (default: 8888 for Docker)
# Use PORT=3000 if running against local npm run dev:
#   PORT=3000 ./scripts/create_agent.sh dean "Duy" "Pham" pilot123

set -e

USERNAME="$1"
FIRST_NAME="$2"
LAST_NAME="$3"
PASSWORD="$4"
PHONE="${5:-}"
EMAIL="${6:-}"
PORT="${PORT:-8888}"     # ← default 8888 (Docker). Override: PORT=3000 ./create_agent.sh ...

if [ -z "$USERNAME" ] || [ -z "$FIRST_NAME" ] || [ -z "$LAST_NAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <username> <first_name> <last_name> <password> [phone] [email]"
  echo "       PORT=3000 $0 <username> <first_name> <last_name> <password>  (for local npm run dev)"
  exit 1
fi

BASE_URL="http://localhost:${PORT}"

echo "Creating agent '$USERNAME' at $BASE_URL..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"first_name\": \"$FIRST_NAME\",
    \"last_name\": \"$LAST_NAME\",
    \"password\": \"$PASSWORD\"
    ${PHONE:+, \"phone\": \"$PHONE\"}
    ${EMAIL:+, \"email\": \"$EMAIL\"}
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Agent created successfully: $USERNAME"
  echo "   Name: $FIRST_NAME $LAST_NAME"
  [ -n "$PHONE" ] && echo "   Phone: $PHONE"
  [ -n "$EMAIL" ] && echo "   Email: $EMAIL"
  echo "   Password: $PASSWORD"
else
  echo "❌ Failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  echo ""
  echo "Troubleshooting:"
  echo "  - Docker running? Try: docker compose ps"
  echo "  - Using npm run dev? Try: PORT=3000 $0 $*"
  echo "  - Port 8888 bound? Try: curl http://localhost:8888"
  exit 1
fi
