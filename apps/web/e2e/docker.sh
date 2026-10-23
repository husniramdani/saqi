#!/usr/bin/env sh
# Runs the E2E suite with the browser inside the official Playwright Linux image, so screenshots
# render like CI's. Servers and the test runner stay on this machine; the browser reaches them
# through Playwright's `exposeNetwork: '<loopback>'` (see playwright.config.ts).
# Usage: pnpm e2e:docker [playwright args], e.g. pnpm e2e:docker --update-snapshots
#        pnpm og (this script with `og`): renders public/og.png with the same browser (e2e/og.ts)
set -eu
VERSION=1.64.1
NAME=saqi-playwright-browser
PORT=3010

docker run -d --rm --init --name "$NAME" -p "$PORT:$PORT" --workdir /home/pwuser --user pwuser \
  "mcr.microsoft.com/playwright:v$VERSION-noble" \
  /bin/sh -c "npx -y playwright@$VERSION run-server --port $PORT --host 0.0.0.0" >/dev/null
trap 'docker stop "$NAME" >/dev/null 2>&1 || true' EXIT INT TERM

i=0
until curl -s "http://127.0.0.1:$PORT" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 90 ] && { echo "Playwright server did not start" >&2; exit 1; }
  sleep 1
done

export PW_BROWSER_WS="ws://127.0.0.1:$PORT/"
if [ "${1:-}" = og ]; then
  node e2e/og.ts
else
  pnpm exec playwright test -c e2e/playwright.config.ts "$@"
fi
