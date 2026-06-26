@echo off
setlocal

cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm.cmd install
)

echo Starting Numera at http://127.0.0.1:5173/
start "Numera Dev Server" cmd /k "npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort"

timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:5173/"

endlocal
