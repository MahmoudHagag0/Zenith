#!/usr/bin/env bash
# Zenith development environment bring-up (S1-026).
#
# Idempotent: safe to run on every Codespace/container creation and every
# subsequent restart. Installs PostgreSQL if missing, starts it if not
# running, ensures the `zenith` database + `postgres` role password exist,
# generates .env files from .env.example (never overwriting an existing
# .env), installs workspace dependencies, runs Prisma migrations, and
# seeds development data (idempotent -- a no-op if already seeded).
#
# This script does not start apps/api or apps/web themselves -- that
# remains `pnpm dev`, unchanged, so the documented one-command flow stays
# `pnpm install && pnpm dev`.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zenith?schema=public"

echo "==> [1/7] PostgreSQL: checking installation"
if ! command -v pg_lsclusters >/dev/null 2>&1; then
  echo "    Installing postgresql (apt)"
  sudo apt-get update -y
  sudo apt-get install -y postgresql
else
  echo "    Already installed."
fi

echo "==> [2/7] PostgreSQL: ensuring the service is running"
if ! pg_isready -q 2>/dev/null; then
  PG_VERSION="$(pg_lsclusters | awk 'NR==2{print $1}')"
  sudo pg_ctlcluster "$PG_VERSION" main start
  for _ in $(seq 1 10); do
    pg_isready -q 2>/dev/null && break
    sleep 1
  done
fi
pg_isready

echo "==> [3/7] PostgreSQL: ensuring the zenith database + postgres role password exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'zenith'" | grep -q 1 \
  || sudo -u postgres createdb zenith

echo "==> [4/7] Generating .env files from .env.example (existing files are never overwritten)"
[ -f apps/api/.env ] || { cp apps/api/.env.example apps/api/.env; echo "    Created apps/api/.env"; }
[ -f apps/web/.env ] || { cp apps/web/.env.example apps/web/.env; echo "    Created apps/web/.env"; }

echo "==> [5/7] Installing dependencies"
pnpm install

echo "==> [6/7] Building @zenith/database (Prisma Client generation + the package's own dist/ apps/api imports)"
pnpm --filter @zenith/database build

echo "==> [7/7] Running Prisma migrations and seeding development data"
(cd packages/database && DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy)
(cd packages/database && DATABASE_URL="$DATABASE_URL" npx prisma db seed)

echo ""
echo "==> Done. Run: pnpm dev"
echo "    apps/web  -> http://localhost:3200"
echo "    apps/api  -> http://localhost:3000/api/v1 (Swagger: /api/docs)"
echo "    Demo login: demo@zenith.dev / DemoPass123!"
