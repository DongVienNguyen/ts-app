#!/bin/bash

echo "🧹 Cleaning project of Next.js dependencies..."

# Remove all build outputs and caches
echo "Removing build outputs..."
rm -rf node_modules
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .cache
rm -rf .parcel-cache

# Remove lock files
echo "Removing lock files..."
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Remove any Next.js config files
echo "Removing Next.js config files..."
rm -f next.config.js
rm -f next.config.mjs
rm -f next.config.ts
rm -f next-env.d.ts

# Check for Next.js in package.json
echo "Checking for Next.js dependencies..."
if grep -q "next" package.json; then
    echo "⚠️  Found Next.js in package.json - please remove manually"
else
    echo "✅ No Next.js found in package.json"
fi

echo "🎉 Project cleaned! Run 'npm install' to reinstall dependencies."