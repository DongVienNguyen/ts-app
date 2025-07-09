#!/bin/bash

echo "🧹 Resetting npm configuration..."

# Remove all package managers artifacts
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock
rm -rf .pnpm-store

echo "✅ Cleaned up package manager files"

# Clear npm cache
npm cache clean --force

echo "✅ Cleared npm cache"

# Install with npm
echo "📦 Installing dependencies with npm..."
npm install

echo "🎉 Setup complete!"
echo "Run: npm run dev"