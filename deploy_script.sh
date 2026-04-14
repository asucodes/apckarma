#!/bin/bash
set -e

echo "Ensuring enough memory for build via swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile || true
    chmod 600 /swapfile || true
    mkswap /swapfile || true
    swapon /swapfile || true
fi

echo "Cleaning previous PM2 processes..."
pm2 delete all || true

echo "Navigating to app directory..."
cd /var/www/apckarma

echo "Fetching latest version from GitHub..."
git fetch origin
git reset --hard origin/main

echo "Installing Dependencies..."
npm install

echo "Building the Application..."
npm run build

echo "Syncing static assets into standalone (required or /_next/static/* 404s)..."
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "Starting Application with PM2 (Next standalone)..."
# next start + output:standalone is unsupported; run the bundled server
ln -sf "$(pwd)/.env" "$(pwd)/.next/standalone/.env"
cd "$(pwd)/.next/standalone"
NODE_OPTIONS=--openssl-legacy-provider HOSTNAME=0.0.0.0 PORT=3000 pm2 start ./server.js --name "apckarma"
cd /var/www/apckarma
pm2 save

echo "Checking port 3000..."
sleep 5
curl -I http://localhost:3000 || echo "Failed to reach local server"
