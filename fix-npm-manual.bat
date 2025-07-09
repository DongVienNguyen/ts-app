@echo off
echo 🔧 Fixing npm workspace error manually...

echo Step 1: Removing package manager files...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist pnpm-lock.yaml del pnpm-lock.yaml
if exist yarn.lock del yarn.lock
if exist .pnpm-store rmdir /s /q .pnpm-store

echo Step 2: Clearing npm cache...
npm cache clean --force

echo Step 3: Resetting npm configuration...
npm config delete workspace 2>nul
npm config delete workspaces 2>nul

echo Step 4: Creating .npmrc...
echo # Force npm usage > .npmrc
echo registry=https://registry.npmjs.org/ >> .npmrc
echo package-lock=true >> .npmrc
echo save-exact=false >> .npmrc
echo save-prefix=^ >> .npmrc
echo fund=false >> .npmrc
echo audit=false >> .npmrc

echo Step 5: Installing dependencies...
npm install

echo.
echo 🎉 Fix complete! You can now run:
echo npm run dev
pause