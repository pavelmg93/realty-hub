# Dev Operations Cheatsheet

Living document. Quick reference for common Docker, DB, VM, and deploy operations.

---

## Docker

```bash
# Start all services (production)
docker compose up -d app-postgres redis web

# Start with pgAdmin (local dev only)
docker compose up -d

# Rebuild web container after code changes
docker compose build web && docker compose up -d web

# View web logs
docker logs realty-hub-web-1 --tail=100

# Live follow logs
docker logs realty-hub-web-1 -f

# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Nuclear restart
docker compose down && docker compose up -d

# ⚠️ NEVER use: docker compose down -v (deletes all data volumes)
```

## Database

```bash
# Connect to psql
docker exec -it realty-hub-app-postgres-1 psql -U re_nhatrang

# Quick table counts
docker exec -it realty-hub-app-postgres-1 psql -U re_nhatrang -c "
SELECT 'agents' as tbl, count(*) FROM agents
UNION ALL SELECT 'parsed_listings', count(*) FROM parsed_listings
UNION ALL SELECT 'conversations', count(*) FROM conversations
UNION ALL SELECT 'listing_photos', count(*) FROM listing_photos;"

# Run a specific migration
docker exec -i realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/014_schema_migrations_tracking.sql

# Run all pending migrations (safe, skips applied)
./scripts/migrate.sh

# Backup
./scripts/backup-db.sh

# List backups
ls -la backups/
```

## Agent Accounts

```bash
# Create agent (new format with first + last name)
./scripts/create_agent.sh <username> <first_name> <last_name> <password> [phone] [email]

# Pilot accounts
./scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn
./scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn
```

## Migrations

```bash
# Apply all pending migrations (idempotent — safe to run repeatedly)
./scripts/migrate.sh

# Check which migrations have been applied
docker exec -it realty-hub-app-postgres-1 psql -U re_nhatrang -c \
  "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;"
```

## VM Operations

```bash
# SSH into VM
ssh pavel@136.110.34.97

# Deploy update (pull + rebuild + migrate)
cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update

# Full fresh deploy
./scripts/deploy-vm.sh

# Check system health
free -h && df -h && uptime

# Emergency: VM out of memory
docker stop realty-hub-pgadmin-1
sudo systemctl stop google-osconfig-agent
```

## GCP VM Resize (no data loss)

1. Stop VM from GCP Console
2. Edit → machine type → e2-medium (4GB)
3. Go to Disks → resize boot disk
4. Start VM
5. SSH in:
```bash
sudo growpart /dev/sda 1
sudo resize2fs /dev/sda1
```

## Swap (if no swap configured)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Docker Disk Cleanup

```bash
# Safe cleanup (keeps running containers)
docker system prune -f

# Nuclear cleanup (removes ALL unused images/volumes)
docker system prune -a --volumes -f

# Check docker disk usage
docker system df
```

## Local Dev (WSL)

```bash
# Start local dev (with hot reload)
cd ~/dev_projects/realty-hub
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Start production mode locally
docker compose up -d

# TypeScript check
cd web && npx tsc --noEmit

# Volume cleanup (if disk full)
docker volume ls
docker system prune -a --volumes -f
```
