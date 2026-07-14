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

# .env generation is deliberately the very first step and has no
# dependency on PostgreSQL. `set -euo pipefail` means any later step
# (apt-get, pg_ctlcluster, sudo -u postgres psql -- all far more
# failure-prone in a fresh devcontainer than the rest of this script)
# aborts everything after it; if .env generation were sequenced after
# those steps, a single Postgres hiccup would silently skip it, leaving
# apps/api without a JWT_SECRET/DATABASE_URL and crashing at boot with
# no obvious link back to this script.
echo "==> [1/7] Generating .env files from .env.example (existing files are never overwritten)"
[ -f apps/api/.env ] || { cp apps/api/.env.example apps/api/.env; echo "    Created apps/api/.env"; }
[ -f apps/web/.env ] || { cp apps/web/.env.example apps/web/.env; echo "    Created apps/web/.env"; }

# Every `sudo` call below uses `-n` (non-interactive): if passwordless
# sudo isn't actually configured for the current user, `-n` makes sudo
# fail immediately with "a password is required" instead of trying to
# read one from stdin. A bare `sudo` can block forever waiting for input
# that a non-interactive postCreateCommand run never provides -- that
# hang, not a real setup failure, is what previously stopped this script
# (and everything after it, including .env generation) from ever
# completing on a Codespace where the default user needs a password.
if ! sudo -n true 2>/dev/null; then
  echo "==> WARNING: passwordless sudo is not available for this user."
  echo "    PostgreSQL install/start and corepack enable need root and will be skipped below."
  echo "    Install PostgreSQL yourself (or grant this user NOPASSWD sudo) and re-run this script."
  SUDO_OK=0
else
  SUDO_OK=1
fi

echo "==> [2/7] PostgreSQL: checking installation"
if ! command -v pg_lsclusters >/dev/null 2>&1; then
  if [ "$SUDO_OK" -eq 1 ]; then
    echo "    Installing postgresql (apt)"
    sudo -n apt-get update -y
    sudo -n apt-get install -y postgresql
  else
    echo "    Skipped (no passwordless sudo) -- PostgreSQL is not installed."
  fi
else
  echo "    Already installed."
fi

echo "==> [3/7] PostgreSQL: ensuring the service is running"
if command -v pg_lsclusters >/dev/null 2>&1 && ! pg_isready -q 2>/dev/null; then
  if [ "$SUDO_OK" -eq 1 ]; then
    PG_VERSION="$(pg_lsclusters | awk 'NR==2{print $1}')"
    sudo -n pg_ctlcluster "$PG_VERSION" main start
    for _ in $(seq 1 10); do
      pg_isready -q 2>/dev/null && break
      sleep 1
    done
  else
    echo "    Skipped (no passwordless sudo)."
  fi
fi
if [ "$SUDO_OK" -eq 1 ]; then
  pg_isready
fi

echo "==> [4/7] PostgreSQL: ensuring the zenith database + postgres role password exist"
if [ "$SUDO_OK" -eq 1 ]; then
  sudo -n -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null
  sudo -n -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'zenith'" | grep -q 1 \
    || sudo -n -u postgres createdb zenith
else
  echo "    Skipped (no passwordless sudo)."
fi

echo "==> [5/7] Installing dependencies"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "    pnpm not on PATH -- enabling corepack (devcontainer.json's postCreateCommand should"
  echo "    already do this, but dev-setup.sh is also documented for manual/local use)"
  if [ "$SUDO_OK" -eq 1 ]; then
    sudo -n corepack enable 2>/dev/null || corepack enable
  else
    corepack enable
  fi
fi
pnpm install

echo "==> [6/7] Building @zenith/database (Prisma Client generation + the package's own dist/ apps/api imports)"
pnpm --filter @zenith/database build

echo "==> [7/7] Running Prisma migrations and seeding development data"
if pg_isready -q 2>/dev/null; then
  (cd packages/database && DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy)
  (cd packages/database && DATABASE_URL="$DATABASE_URL" npx prisma db seed)
else
  echo "    Skipped -- PostgreSQL is not reachable (see the sudo warning above)."
fi

echo ""
echo "==> Done. Run: pnpm dev"
echo "    apps/web  -> http://localhost:3200"
echo "    apps/api  -> http://localhost:3000/api/v1 (Swagger: /api/docs)"
echo "    Demo login: demo@zenith.dev / DemoPass123!"
