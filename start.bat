@echo off
REM TrailGuesser inditasa Windows alatt. A bongeszot is megnyitja.
cd /d "%~dp0"
echo TrailGuesser inditasa...
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8080"
node server.js
pause
