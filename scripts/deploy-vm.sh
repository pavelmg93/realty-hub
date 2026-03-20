#!/bin/bash
# scripts/deploy-vm.sh — Deploy ProMemo to a GCP VM
#
# Usage:
#   Fresh install:  ./scripts/deploy-vm.sh
#   Update only:    ./scripts/deploy-vm.sh update
#
# Prerequisites: Ubuntu 22.04+ VM with at least 2 CPU / 4 GB RAM

set -e

MODE="${1:-full}"

echo "=== ProMemo VM Deployment (mode: $MODE) ==="
echo ""

# ─── 1. Install Docker if not present ───
if ! command -v docker &> /dev/null; then
  echo ">>> Installing Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo ">>> Docker installed. Log out and back in if 'docker' commands fail with permission errors."
  echo ">>> Then re-run this script."
else
  echo ">>> Docker already installed: $(docker --version)"
fi

# ─── 2. Create .env if missing ───
if [ ! -f .env ]; then
  echo ">>> Creating .env from .env.example..."
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_SECRET=dev-secret-change-me/JWT_SECRET=$JWT_SECRET/" .env
  echo ">>> .env created."
  echo ">>> IMPORTANT: Edit .env to set APP_DB_PASSWORD and GEMINI_API_KEY"
else
  echo ">>> .env already exists"
fi

# ─── 3. Create uploads directories with proper permissions ───
echo ">>> Setting up uploads directory..."
mkdir -p uploads/listings uploads/photos uploads/documents uploads/avatars
# chmod only on fresh deploy — in update mode files are owned by the container
# (root inside Alpine) and cannot be chmodded by the host user.
if [ "$MODE" != "update" ]; then
  chmod -R 777 uploads 2>/dev/null || true
fi
echo ">>> uploads directory ready (listings, photos, documents, avatars)"

# ─── 4. Build and start containers ───
echo ">>> Building and starting containers..."
if [ "$MODE" = "update" ]; then
  echo ">>> Update mode: rebuilding web only..."
  docker compose build web
  docker compose up -d web
else
  docker compose up -d --build
fi

# ─── 5. Wait for PostgreSQL ───
echo ">>> Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T app-postgres pg_isready -U re_nhatrang > /dev/null 2>&1; then
    echo ">>> PostgreSQL is ready!"
    break
  fi
  if [ "$i" = "30" ]; then
    echo ">>> ERROR: PostgreSQL did not become ready in 60 seconds"
    exit 1
  fi
  sleep 2
done

# ─── 6. Run seed data and all migrations ───
echo ">>> Running seed data..."
docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang < src/db/seed_reference_data.sql 2>&1 | tail -1

echo ">>> Running migrations (skips already-applied)..."
./scripts/migrate.sh

# ─── 7. Wait for Next.js to compile, then create demo accounts ───
if [ "$MODE" != "update" ]; then
  echo ">>> Waiting for Next.js to start (this takes 30-60s on first build)..."
  for i in $(seq 1 60); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 2>/dev/null | grep -q "200\|307"; then
      echo ">>> Next.js is ready!"
      break
    fi
    if [ "$i" = "60" ]; then
      echo ">>> WARNING: Next.js may not be ready yet. Creating accounts anyway..."
    fi
    sleep 2
  done

  echo ">>> Creating demo accounts..."
  ./scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn || true
  ./scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn || true
fi

# ─── 8. Summary ───
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "  Web app:  http://${IP}:8888"
echo "  pgAdmin:  http://${IP}:5050"
echo ""
echo "  Demo accounts: pavel/pilot123, dean/pilot123"
echo ""
echo "  Useful commands:"
echo "    docker compose logs web -f --tail=50    # view logs"
echo "    docker compose build web && docker compose up -d web  # rebuild"
echo "    ./scripts/deploy-vm.sh update           # pull + rebuild + migrate"
echo ""
