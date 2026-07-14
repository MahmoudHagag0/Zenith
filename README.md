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

This repository's automation (`.devcontainer/devcontainer.json`, `scripts/dev-setup.sh`) has been authored and exercised inside a persistent Linux sandbox that does **not** run through GitHub Codespaces' own container-provisioning layer -- it has no Docker daemon available to build and boot the actual devcontainer image, and cannot execute `postCreateCommand`/`postStartCommand` the way Codespaces does. Every step has been verified structurally (each script's logic, ordering, and failure-recovery behavior tested directly and via deliberate failure injection) and functionally against a real PostgreSQL instance, but the very first `postCreateCommand` invocation inside an actual, freshly-created Codespace container has not been observed directly from this environment. If `bash scripts/dev-setup.sh` ever fails to run automatically on container creation, run it manually once (`bash scripts/dev-setup.sh`) -- it is fully idempotent and safe to re-run.
