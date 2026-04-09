#!/bin/bash
set -ex
echo "Updating package cache..."
sudo dnf makecache
echo "Installing git and nodejs..."
sudo dnf install -y git nodejs
echo "Cloning/Updating repository..."
if [ ! -d "apckarma" ]; then
  git clone https://github.com/asucodes/apckarma.git
fi
cd apckarma
git pull
echo "Installing npm dependencies..."
npm install
echo "Done!"
