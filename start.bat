@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto missing_node

where npm >nul 2>nul
if errorlevel 1 goto missing_npm

if exist "node_modules\axios\package.json" goto start_server
if exist "scrapr\node_modules\axios\package.json" goto start_server
echo Installing scrapr dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 goto install_failed

:start_server
call npm start
exit /b %errorlevel%

:missing_node
echo Node.js is required. Install Node.js 16 or newer, then run start.bat again.
pause
exit /b 1

:missing_npm
echo npm is required. Repair your Node.js installation, then run start.bat again.
pause
exit /b 1

:install_failed
echo Dependency installation failed. Check your internet connection and try again.
pause
exit /b 1
