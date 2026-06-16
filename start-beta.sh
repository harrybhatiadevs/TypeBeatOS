#!/usr/bin/env bash
# Launch TypeBeatOS as a public beta via a Cloudflare quick tunnel.
# Usage: ./start-beta.sh
# Stop later with: ./stop-beta.sh
set -euo pipefail
cd "$(dirname "$0")"

PORT=3000
SERVER_LOG=/tmp/typebeatos-server.log
TUNNEL_LOG=/tmp/typebeatos-tunnel.log

echo "→ Freeing port $PORT…"
lsof -ti :$PORT -sTCP:LISTEN | xargs kill 2>/dev/null || true
pkill -f 'cloudflared tunnel --url' 2>/dev/null || true
sleep 1

echo "→ Starting Cloudflare tunnel…"
: > "$TUNNEL_LOG"
nohup cloudflared tunnel --url http://localhost:$PORT > "$TUNNEL_LOG" 2>&1 &

URL=""
for _ in $(seq 1 30); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then echo "✗ Tunnel URL not found — see $TUNNEL_LOG"; exit 1; fi

echo "→ Public URL: $URL"
echo "→ Setting APP_URL in .env…"
if grep -q '^APP_URL=' .env 2>/dev/null; then
  sed -i '' "s#^APP_URL=.*#APP_URL=$URL#" .env
else
  printf '\nAPP_URL=%s\n' "$URL" >> .env
fi

echo "→ Building…"
npm run build >/dev/null 2>&1

echo "→ Starting server…"
nohup npm start > "$SERVER_LOG" 2>&1 &
for _ in $(seq 1 30); do curl -sf -o /dev/null "$URL/waitlist" && break || sleep 1; done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  TypeBeatOS beta is LIVE:"
echo "    $URL/waitlist   (waitlist page)"
echo "    $URL            (app)"
echo ""
echo "  For YouTube 'Connect' to work, add this redirect URI in"
echo "  Google Cloud → Credentials → your OAuth client:"
echo "    $URL/api/youtube/callback"
echo "  (and keep testers under OAuth consent → Test users)"
echo ""
echo "  Keep this Mac awake & this terminal session alive."
echo "════════════════════════════════════════════════════════════"
