# RUNBOOK — Realty Hub Production Operations

**VM:** `promemo-demo-2` — `136.110.34.97` (GCP, `us-central1`)
**Domain:** `https://realtyhub.xeldon.com` (Cloudflare proxy → port 8888)
**App port:** 8888 (mapped from container port 3000)

---

## 1. Create Agent Accounts

No public signup. Admin only.

```bash
# SSH into VM
ssh pavel@136.110.34.97

# Create account
./scripts/create_agent.sh <username> <first_name> <last_name> <password> [phone] [email]

# Examples
./scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn
./scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn
```

The script calls `POST /api/auth/signup` internally. The agent can log in immediately.

---

## 2. Backup & Restore Database

### Backup

```bash
# Run from project root on VM
./scripts/backup-db.sh
```

Saves a gzipped pg_dump to `backups/YYYY-MM-DD-HHMMSS.sql.gz`. Keeps 7 most recent, prunes older.

### Restore to temp container (verification)

```bash
# Start a temporary postgres container
docker run --rm -d --name pg-restore-test \
  -e POSTGRES_USER=re_nhatrang \
  -e POSTGRES_PASSWORD=change_me_in_production \
  -e POSTGRES_DB=re_nhatrang \
  -p 5433:5432 \
  postgres:16

# Wait for it to start
sleep 3

# Restore
gunzip -c backups/<BACKUP_FILE>.sql.gz \
  | docker exec -i pg-restore-test psql -U re_nhatrang -d re_nhatrang

# Verify
docker exec -it pg-restore-test psql -U re_nhatrang -d re_nhatrang \
  -c "SELECT COUNT(*) FROM parsed_listings;"

# Cleanup
docker stop pg-restore-test
```

### Restore to production (disaster recovery)

```bash
# Stop the web container first to prevent writes
docker compose stop web

# Restore into production postgres
gunzip -c backups/<BACKUP_FILE>.sql.gz \
  | docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# Restart web
docker compose start web
```

### Schedule daily backups (cron)

Add to crontab on VM (`crontab -e`):

```cron
# Backup Realty Hub DB daily at 02:00
0 2 * * * /home/pavel/realty-hub/scripts/backup-db.sh >> /home/pavel/realty-hub/backups/cron.log 2>&1
```

---

## 3. Restart Services

```bash
# All services
docker compose restart

# Web only (no rebuild)
docker compose restart web

# Full rebuild (after Dockerfile changes)
docker compose build web && docker compose up -d

# Check status
docker compose ps
```

---

## 4. View Logs

```bash
# Web app (live)
docker compose logs web -f --tail=50

# Postgres
docker compose logs postgres -f --tail=50

# All services
docker compose logs -f --tail=20

# Last 200 lines, no follow
docker compose logs web --tail=200
```

---

## 5. Apply Database Migrations

```bash
# Connect to DB
docker exec -it re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# Run a migration file
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/012_staging_photos_docs.sql

# Check current migration state
docker exec -it re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  -c "\d parsed_listings"
```

**Current migration level: 012**

After fresh `docker compose down -v && up -d`, run in order:
1. `src/db/seed_reference_data.sql`
2. Migrations 002 through 012

---

## 6. Deploy Updates

```bash
# On VM: pull latest and restart
git pull origin main
docker compose build web && docker compose up -d

# Or use the deploy script
./scripts/deploy-vm.sh update
```

See `docs/DEPLOYMENT.md` for full deployment guide.

---

## 7. Check App Health

```bash
# HTTP check (from VM, direct port)
curl -I http://localhost:8888

# HTTPS check (via Cloudflare)
curl -I https://realtyhub.xeldon.com

# DB connection test
docker exec re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  -c "SELECT NOW();"
```

---

## 8. Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| App returns 502 | Web container crashed | `docker compose restart web` |
| Login cookie not persisting | `JWT_SECRET` changed | Restart web container |
| DB connection refused | Postgres container down | `docker compose up -d postgres` |
| Uploads 404 | `uploads-data` volume missing | Check `docker volume ls` |
| TypeScript build error | Code change broke types | `cd web && npx tsc --noEmit` |

---

## 9. Environment Variables

Managed in `.env` at project root. Never commit `.env`. See `.env.example` for template.

Key variables:
- `JWT_SECRET` — change from default in production
- `ENV_GEMINI_API_KEY` — passed to container as `GEMINI_API_KEY`
- `DOMAIN` — `realtyhub.xeldon.com`
- `WEB_PORT` — `8888`

After changing `.env`, restart the web container:
```bash
docker compose up -d web
```
