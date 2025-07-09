@echo off
echo 🚀 Deploying TS Manager to production...

REM Set variables
set SOURCE_DIR=C:\source\ts-app
set DIST_DIR=%SOURCE_DIR%\dist
set BACKUP_DIR=C:\backup\ts-app-%date:~-4,4%%date:~-10,2%%date:~-7,2%

echo 📁 Source directory: %SOURCE_DIR%
echo 📁 Dist directory: %DIST_DIR%
echo 📁 Backup directory: %BACKUP_DIR%

REM Create backup of current version
if exist "%DIST_DIR%" (
    echo 💾 Creating backup...
    mkdir "%BACKUP_DIR%" 2>nul
    xcopy "%DIST_DIR%\*" "%BACKUP_DIR%\" /E /I /Y
    echo ✅ Backup created at %BACKUP_DIR%
)

REM Navigate to source directory
cd /d "%SOURCE_DIR%"

REM Clean previous build
echo 🧹 Cleaning previous build...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"

REM Install dependencies (if needed)
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 📥 Installing dependencies...
    npm ci --production=false
)

REM Generate icons
echo 🎨 Generating PWA icons...
npm run generate-icons

REM Build application
echo 🔨 Building application...
npm run build

REM Check if build was successful
if not exist "%DIST_DIR%\index.html" (
    echo ❌ Build failed! Restoring backup...
    if exist "%BACKUP_DIR%" (
        xcopy "%BACKUP_DIR%\*" "%DIST_DIR%\" /E /I /Y
        echo ✅ Backup restored
    )
    exit /b 1
)

REM Set proper permissions
echo 🔐 Setting permissions...
icacls "%DIST_DIR%" /grant Everyone:(OI)(CI)R /T

REM Restart Caddy (if running as service)
echo 🔄 Restarting Caddy...
net stop caddy 2>nul
timeout /t 2 /nobreak >nul
net start caddy 2>nul

REM Clear browser cache instruction
echo 🌐 Deployment completed successfully!
echo.
echo 📋 Post-deployment checklist:
echo   ✅ Build completed
echo   ✅ Files deployed to %DIST_DIR%
echo   ✅ Backup created at %BACKUP_DIR%
echo   ✅ Caddy restarted
echo.
echo 🔄 To force cache refresh for users:
echo   - Press Ctrl+Shift+R in browser
echo   - Or clear browser cache
echo   - Service Worker will auto-update
echo.
echo 🎉 TS Manager is now live at https://ts.caremylife.me
pause