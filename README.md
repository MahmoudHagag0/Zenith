# Zenith

Official Zenith Git Repository

## Development

```
pnpm install
pnpm dev
```

This starts both workspace apps in parallel via Turborepo:

| App             | Port | URL                            |
| ---------------- | ---- | ------------------------------- |
| `apps/web` (Next.js) | 3200 | http://localhost:3200 |
| `apps/api` (NestJS)  | 3000 | http://localhost:3000/api/v1 (Swagger: `/api/docs`) |

`apps/web` is the Zenith application itself (login, Dashboard, Morning Brief, Watchlist, Portfolio). `apps/api` requires a local PostgreSQL instance and a `.env` file (copy `apps/api/.env.example`) before it will serve real data; without one, the web app still loads but data-fetching pages will show an error until the API is reachable.

Opening this repository in GitHub Codespaces (see `.devcontainer/devcontainer.json`) forwards port 3200 (the web app) and 3000 (the API) automatically and runs `pnpm install` on creation.
