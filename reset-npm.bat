@echo off
echo 🧹 Resetting npm configuration...

REM Remove all package managers artifacts
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist pnpm-lock.yaml del pnpm-lock.yaml
if exist yarn.lock del yarn.lock
if exist .pnpm-store rmdir /s /q .pnpm-store

echo ✅ Cleaned up package manager files

REM Clear npm cache
npm cache clean --force

echo ✅ Cleared npm cache

REM Install with npm
echo 📦 Installing dependencies with npm...
npm install

echo 🎉 Setup complete!
echo Run: npm run dev
pause