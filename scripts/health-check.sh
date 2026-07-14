#!/usr/bin/env bash
# Quick readiness check for the Zenith dev stack (S1-026). Run after
# `pnpm dev` to confirm both apps and the database are actually reachable,
# rather than guessing from log output.
set -uo pipefail

ok=0

echo -n "PostgreSQL (5432)........ "
if pg_isready -q 2>/dev/null; then echo "UP"; else echo "DOWN"; ok=1; fi

echo -n "apps/api health (3000)... "
if curl -sf -o /dev/null http://localhost:3000/api/v1/health; then echo "UP"; else echo "DOWN"; ok=1; fi

echo -n "apps/web (3200)........... "
if curl -sf -o /dev/null http://localhost:3200/login; then echo "UP"; else echo "DOWN"; ok=1; fi

if [ "$ok" -eq 0 ]; then
  echo ""
  echo "All services ready. Open http://localhost:3200/login"
else
  echo ""
  echo "One or more services are not reachable yet -- if you just ran 'pnpm dev', give it a few more seconds."
fi

exit $ok
