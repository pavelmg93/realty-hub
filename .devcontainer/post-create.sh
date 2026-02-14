#!/usr/bin/env bash
# Post-create setup for GitHub Codespaces / Dev Containers
set -euo pipefail

echo "=== RE Nha Trang: Post-create setup ==="

# 1. Copy .env.example -> .env if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from .env.example"
else
  echo "[OK] .env already exists"
fi

# 2. Install Python dependencies (uv)
if ! command -v uv &>/dev/null; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[scraping]"
echo "[OK] Python dependencies installed"

# 3. Install Node dependencies for the web app
cd web
npm install
cd ..
echo "[OK] Node dependencies installed"

# 4. Start infrastructure services via docker compose
docker compose up -d app-postgres redis
echo "[OK] PostgreSQL and Redis started"

# 5. Wait for Postgres to be ready
echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T app-postgres pg_isready -U re_nhatrang &>/dev/null; then
    echo "[OK] PostgreSQL is ready"
    break
  fi
  sleep 1
done

# 6. Run database migrations
CONTAINER=$(docker compose ps -q app-postgres)
echo "Running seed data and migrations..."
docker exec -i "$CONTAINER" psql -U re_nhatrang -d re_nhatrang < src/db/seed_reference_data.sql
for migration in src/db/migrations/0*.sql; do
  echo "  Applying $migration..."
  docker exec -i "$CONTAINER" psql -U re_nhatrang -d re_nhatrang < "$migration"
done
echo "[OK] Database migrations applied"

# 7. Create uploads directory
mkdir -p uploads
echo "[OK] Uploads directory ready"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Quick start:"
echo "  docker compose up -d          # Start all services (Kestra, pgAdmin, web)"
echo "  cd web && npm run dev         # Run web app locally on :3000"
echo "  source .venv/bin/activate     # Activate Python venv"
echo "  pytest tests/ -v              # Run Python tests"
echo ""
echo "Create an agent account:"
echo "  ./scripts/create_agent.sh <username> <first_name> <password> [phone] [email]"
