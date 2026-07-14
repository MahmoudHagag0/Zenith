#!/usr/bin/env bash
# Blocks until apps/api's health endpoint responds, so apps/web's dev server
# (and therefore Codespaces' auto-opened preview) never becomes reachable
# before the API is actually ready to serve `/auth/login`. Without this,
# `pnpm dev` starts both apps concurrently with no ordering between them;
# apps/api's NestJS bootstrap (Prisma connect + provider registration) can
# take longer than Next.js's first response, so a login attempt made in
# that window fails with a raw "fetch failed" (ECONNREFUSED) error.
#
# Degrades gracefully: if the API isn't up after the timeout, proceeds
# anyway rather than blocking forever, so an unrelated API failure doesn't
# also prevent apps/web from starting.
set -uo pipefail

HEALTH_URL="http://localhost:3000/api/v1/health"
TIMEOUT_SECONDS=60
elapsed=0

echo "==> Waiting for apps/api ($HEALTH_URL) before starting apps/web..."
until curl -sf -o /dev/null "$HEALTH_URL" 2>/dev/null; do
  if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
    echo "==> apps/api did not respond within ${TIMEOUT_SECONDS}s -- starting apps/web anyway."
    break
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

if [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; then
  echo "==> apps/api is ready."
fi
