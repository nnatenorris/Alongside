@echo off
setlocal
cd /d "%~dp0backend"

if not exist node_modules (
    echo Installing backend dependencies - this only happens once...
    call npm install
)

if not exist "..\frontend\dist\index.html" (
    echo Building the app for the first time - this only happens once...
    pushd ..\frontend
    if not exist node_modules (
        call npm install
    )
    call npm run build
    popd
)

echo Starting Inbox Manager...
start "Inbox Manager - keep this window open while you use the app" cmd /k "npm run dev"

timeout /t 4 /nobreak >nul
start "" http://localhost:4100

endlocal
