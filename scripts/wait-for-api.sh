#!/usr/bin/env bash
# Blocks until apps/api's health endpoint responds, so apps/web's dev server
# (and therefore Codespaces' auto-opened preview) never becomes reachable
# before the API is actually ready to serve `/auth/login`. Without this,
# `pnpm dev` starts both apps concurrently with no ordering between them;
# apps/api's NestJS bootstrap (webpack compile on a cold cache, Prisma
# connect, provider registration) can take longer than Next.js's first
# response, so a login attempt made in that window fails with a raw
# "fetch failed" (ECONNREFUSED) error.
#
# Waits indefinitely rather than giving up after a fixed timeout: a
# timeout-and-proceed-anyway fallback reintroduces the exact race this
# script exists to prevent -- apps/web would start (and Codespaces would
# auto-open its preview) while apps/api is still unreachable, which is
# what "Fetch failed" actually was. If apps/api is genuinely broken (not
# just slow), it should be diagnosed directly rather than papered over by
# starting apps/web into a permanently broken state.
set -uo pipefail

HEALTH_URL="http://localhost:3000/api/v1/health"
elapsed=0

echo "==> Waiting for apps/api ($HEALTH_URL) before starting apps/web..."
until curl -sf -o /dev/null "$HEALTH_URL" 2>/dev/null; do
  if [ $((elapsed % 30)) -eq 0 ] && [ "$elapsed" -gt 0 ]; then
    echo "==> Still waiting for apps/api (${elapsed}s so far) -- check the apps/api log if this continues."
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

echo "==> apps/api is ready after ${elapsed}s."
