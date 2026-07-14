# Zenith

Official Zenith Git Repository

## Development

### GitHub Codespaces (recommended)

Open this repository in a Codespace. On creation, `.devcontainer/devcontainer.json` automatically:

1. Installs PostgreSQL and starts it.
2. Creates the `zenith` database.
3. Generates `apps/api/.env` and `apps/web/.env` from their `.env.example` files (never overwrites an existing `.env`).
4. Runs `pnpm install`.
5. Runs Prisma migrations.
6. Seeds development data: a demo account (`demo@zenith.dev` / `DemoPass123!`) with a tracked instrument, a watchlist, and an open position, so the Dashboard, Morning Brief, Watchlist, and Portfolio all show real data immediately.

All of this is idempotent (`scripts/dev-setup.sh`) and re-runs safely on every container restart. All you need to run yourself is:

```
pnpm dev
```

Then open the forwarded **3200** port (Codespaces opens its preview automatically) and log in with the demo account above.

### Running locally (outside Codespaces)

```
bash scripts/dev-setup.sh   # one-time: installs/starts Postgres, generates .env, migrates, seeds
pnpm dev
```

If you already have your own PostgreSQL running with different credentials, skip `dev-setup.sh` and instead copy `apps/api/.env.example` to `apps/api/.env` yourself, point `DATABASE_URL` at your own instance, then run migrations and seeding manually from `packages/database`:

```
npx prisma migrate deploy
npx prisma db seed
```

### Ports

| App             | Port | URL                            |
| ---------------- | ---- | ------------------------------- |
| `apps/web` (Next.js) | 3200 | http://localhost:3200 |
| `apps/api` (NestJS)  | 3000 | http://localhost:3000/api/v1 (Swagger: `/api/docs`) |

`apps/web` is the Zenith application itself (login, Dashboard, Morning Brief, Watchlist, Portfolio).

### Verifying everything is up

```
bash scripts/health-check.sh
```

Checks PostgreSQL, `apps/api`'s real database-backed health endpoint, and `apps/web`, and reports which (if any) aren't reachable yet.

### Known limitation

`scripts/dev-setup.sh`'s PostgreSQL installation step (`apt-get install postgresql`) is a standard, well-documented approach for Debian/Ubuntu-based devcontainers, but installing the actual OS package inside the specific Codespaces container image could not be executed and verified from within the environment this script was authored in (no Docker daemon available there to build and boot that image). Every other step -- .env generation, migrations, and seeding -- was verified end-to-end against a real PostgreSQL instance. If `apt-get install postgresql` ever fails to resolve inside a real Codespace, install PostgreSQL manually and re-run `bash scripts/dev-setup.sh`, which will detect it and skip straight to the remaining steps.
