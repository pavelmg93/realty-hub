#!/bin/bash
# scripts/deploy-vm.sh — Deploy ProMemo to a fresh GCP VM
# Run this script on the VM after cloning the repo.
#
# Prerequisites: Ubuntu 22.04+ VM with at least 2 CPU / 4 GB RAM
# Usage: ./scripts/deploy-vm.sh

set -e

echo "=== ProMemo GCP VM Deployment ==="
echo ""

# 1. Install Docker if not present
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
  echo ">>> Docker installed. You may need to log out and back in for group changes."
else
  echo ">>> Docker already installed: $(docker --version)"
fi

# 2. Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo ">>> Creating .env from .env.example..."
  cp .env.example .env
  # Generate a random JWT secret
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_SECRET=dev-secret-change-me/JWT_SECRET=$JWT_SECRET/" .env
  echo ">>> .env created. Edit it to set your passwords and API keys."
  echo ">>> IMPORTANT: Change APP_DB_PASSWORD from the default!"
else
  echo ">>> .env already exists"
fi

# 3. Create uploads directory
mkdir -p uploads/listings
echo ">>> uploads directory ready"

# 4. Build and start
echo ">>> Building and starting containers..."
docker compose up -d --build

# 5. Wait for postgres to be healthy
echo ">>> Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T app-postgres pg_isready -U re_nhatrang > /dev/null 2>&1; then
    echo ">>> PostgreSQL is ready!"
    break
  fi
  sleep 2
done

# 6. Run seed data and migrations
echo ">>> Running seed data..."
docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang < src/db/seed_reference_data.sql

echo ">>> Running migrations (002-011)..."
for migration in src/db/migrations/*.sql; do
  echo "   Applying: $(basename $migration)"
  docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang < "$migration"
done

# 7. Create demo accounts
echo ">>> Creating demo accounts..."
sleep 5  # Wait for Next.js to compile
./scripts/create_agent.sh pavel "Pavel" demo123 || true
./scripts/create_agent.sh dean "Duy (Dean) Pham" demo123 0868331111 dean@fidt.vn || true

echo ""
echo "=== Deployment Complete ==="
echo "Web app:  http://$(hostname -I | awk '{print $1}'):8888"
echo "pgAdmin:  http://$(hostname -I | awk '{print $1}'):5050"
echo ""
echo "Demo accounts: pavel/demo123, dean/demo123"
echo ""
echo "To view logs: docker compose logs web -f --tail=50"
echo "To rebuild:   docker compose build web && docker compose up -d"
