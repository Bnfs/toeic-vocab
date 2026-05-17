@echo off
echo Demarrage de TOEIC Vocab...
cd /d %~dp0
start "Backend" python -m uvicorn main:app --port 8003 --reload
timeout /t 2 /nobreak >nul
cd frontend
start "Frontend" npm run dev
echo.
echo Backend : http://127.0.0.1:8003
echo Frontend : http://localhost:5173
pause
