#!/bin/bash
# APC Karma — Production Deploy Script
# Usage: chmod +x deploy_script.sh && ./deploy_script.sh
# Run from: /var/www/apckarma (or any location — it always cd's there)

set -euo pipefail

APP_DIR="/var/www/apckarma"
APP_NAME="apckarma"

# ── 1. Swap (build needs ~1.5GB RAM) ─────────────────────────────────────────
echo "==> [1/7] Ensuring swap memory..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 2. Pull latest code ───────────────────────────────────────────────────────
echo "==> [2/7] Pulling latest code from GitHub..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

# ── 3. Verify .env exists (required for Google Sheets API) ───────────────────
echo "==> [3/7] Checking .env..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "ERROR: $APP_DIR/.env not found. Create it before deploying."
    exit 1
fi

# ── 4. Install dependencies ───────────────────────────────────────────────────
echo "==> [4/7] Installing npm dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install

# ── 5. Build ──────────────────────────────────────────────────────────────────
echo "==> [5/7] Building Next.js standalone..."
npm run build

# ── 6. Copy static assets (required — standalone server doesn't serve these) ─
echo "==> [6/7] Syncing static assets into standalone..."
mkdir -p "$APP_DIR/.next/standalone/.next"
rm -rf "$APP_DIR/.next/standalone/.next/static" "$APP_DIR/.next/standalone/public"
cp -r "$APP_DIR/.next/static" "$APP_DIR/.next/standalone/.next/static"
cp -r "$APP_DIR/public"       "$APP_DIR/.next/standalone/public"

# Symlink .env so standalone server picks up env vars
ln -sf "$APP_DIR/.env" "$APP_DIR/.next/standalone/.env"

# ── 7. Start / restart via PM2 ────────────────────────────────────────────────
echo "==> [7/7] Restarting app with PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    # App already registered — restart and refresh env
    pm2 delete "$APP_NAME"
fi

# Start from the standalone dir so __dirname resolves correctly
NODE_OPTIONS="--openssl-legacy-provider" \
HOSTNAME="0.0.0.0" \
PORT="3000" \
pm2 start "$APP_DIR/.next/standalone/server.js" \
    --name "$APP_NAME" \
    --cwd  "$APP_DIR/.next/standalone"

pm2 save --force

# ── Health check ──────────────────────────────────────────────────────────────
echo ""
echo "Waiting 5s for server to start..."
sleep 5
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Server is up and healthy (HTTP $HTTP_STATUS)"
else
    echo "✗ Server returned HTTP $HTTP_STATUS — check: pm2 logs $APP_NAME"
    exit 1
fi
