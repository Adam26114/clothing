#!/usr/bin/env bash
set -e

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing stale dev server on port $port (PIDs: $pids)"
    kill -9 $pids 2>/dev/null || true
  fi
}

kill_port 3000
kill_port 3001
kill_port 3210

echo "Pushing latest Convex schema + functions (idempotent)..."
if [ -f "packages/convex/convex.json" ]; then
  (cd packages/convex && bunx --bun convex dev --once) || echo "Convex push skipped (network/auth issue); Next.js apps will still start"
else
  echo "packages/convex/convex.json not found; skipping Convex push"
fi
