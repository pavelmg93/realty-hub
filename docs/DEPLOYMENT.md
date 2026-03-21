# Deployment Guide — Realty Hub on GCP VM

## Quick Reference

| Action | Command |
|---|---|
| Fresh deploy | `./scripts/deploy-vm.sh` |
| Pull + rebuild + migrate | `git pull && ./scripts/deploy-vm.sh update` |
| Rebuild web only | `docker compose build web && docker compose up -d web` |
| View logs | `docker compose logs web -f --tail=50` |
| Run a migration | `docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang < src/db/migrations/XXX.sql` |
| Create agent | `./scripts/create_agent.sh <user> <first_name> <last_name> <pass> [phone] [email]` |
| DB shell | `docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang` |

---

## Fresh VM Setup (from scratch)

### 1. Provision VM
- Ubuntu 22.04+, 2 CPU / 4 GB RAM minimum
- Open firewall ports: **8888** (web), **5050** (pgAdmin), **22** (SSH)

### 2. Clone repo
```bash
git clone https://github.com/pavelmg93/re-nhatrang.git
cd re-nhatrang
```

### 3. Run deploy script
```bash
chmod +x scripts/deploy-vm.sh scripts/create_agent.sh
./scripts/deploy-vm.sh
```

This will:
- Install Docker if missing
- Create `.env` from `.env.example` with random JWT secret
- Create `uploads/` directories with correct permissions
- Build and start all containers
- Run seed data and all migrations
- Wait for Next.js and create demo accounts

### 4. Edit .env (important)
```bash
nano .env
```
Set at minimum:
- `APP_DB_PASSWORD` — change from default
- `ENV_GEMINI_API_KEY` — for AI listing parse

Then restart: `docker compose up -d`

---

## Updating an Existing VM

```bash
cd ~/re-nhatrang
git pull
./scripts/deploy-vm.sh update
```

This rebuilds the web container and runs any new migrations. DB data is preserved.

### Manual update (equivalent):
```bash
git pull
docker compose build web
docker compose up -d web

# Run new migrations (skips already-applied)
./scripts/migrate.sh
```

---

## Troubleshooting

### "Permission denied" on uploads
```bash
chmod -R 777 uploads
```

### Docker permission denied
Log out and back in after Docker install (group change needs new session), or prefix with `sudo`.

### "Column does not exist" errors
Missing migrations. Run all (skips already-applied):
```bash
./scripts/migrate.sh
```

### Next.js takes forever to start
First cold start on a small VM can take 60-90 seconds. Check with:
```bash
docker compose logs web -f --tail=20
```

### Container keeps restarting
```bash
docker compose logs web --tail=50   # check for errors
docker compose down web && docker compose build web --no-cache && docker compose up -d web
```

### DB data wiped
Only happens with `docker compose down -v` (the `-v` flag removes volumes). Never use `-v` unless you want a fresh DB. After a fresh DB, re-run:
```bash
docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang < src/db/seed_reference_data.sql
./scripts/migrate.sh
./scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn
./scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn
```

---

## Architecture

```
Internet → :8888 → Docker web container (Next.js :3000)
                  → Docker app-postgres (PostgreSQL :5432)
                  → Docker pgadmin (:5050)
                  → Docker redis (:6379)

Host filesystem:
  ./uploads/  →  mounted as /app/uploads inside web container
  app-pg-data →  Docker volume for PostgreSQL data (survives rebuilds)
```
