#!/usr/bin/env bash
# Stop the TypeBeatOS beta server + Cloudflare tunnel.
# Usage: bash stop-beta.sh
echo ">> Stopping tunnel ..."
pkill -f 'cloudflared tunnel --url' 2>/dev/null || true
echo ">> Stopping server on :3000 ..."
lsof -ti :3000 -sTCP:LISTEN | xargs kill 2>/dev/null || true
echo "Done."
