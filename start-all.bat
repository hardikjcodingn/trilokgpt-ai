@echo off
REM Start both Ollama and TrilokGPT Backend Server
REM This opens two terminals - one for Ollama, one for the backend

echo.
echo ============================================
echo   Starting TrilokGPT Complete System
echo ============================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not installed
    echo Please run install-ollama.bat first
    pause
    exit /b 1
)

echo [1/2] Starting Ollama service...
start "Ollama Server" cmd /k "ollama serve"

timeout /t 3

echo [2/2] Starting TrilokGPT Backend Server...
start "TrilokGPT Backend" cmd /k "cd /d ""c:\Users\LENOVO\Desktop\Own AI\trilokgpt-ai\backend"" && npm start"

echo.
echo ============================================
echo   System Starting...
echo ============================================
echo.
echo Services:
echo   - Ollama:      http://localhost:11434
echo   - Backend API: http://localhost:8000
echo   - Health:      http://localhost:8000/health
echo.
echo Keep both terminals open while using the system.
echo Press any key to close this window...
pause >nul
