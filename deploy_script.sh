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

echo "Starting Application with PM2..."
pm2 start npm --name "apckarma" -- start
pm2 save

echo "Checking port 3000..."
sleep 5
curl -I http://localhost:3000 || echo "Failed to reach local server"
