@echo off
REM TrilokGPT Quick Start Script for Windows

echo.
echo ============================================
echo    TrilokGPT - AI Document Q&A System
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version

REM Check if Ollama is running
echo.
echo Checking Ollama service...
timeout /t 2 /nobreak >nul

curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama is not running!
    echo Please start Ollama before running the server:
    echo   1. Open Command Prompt
    echo   2. Run: ollama serve
    echo   3. In another Command Prompt, download models:
    echo      ollama pull llama2
    echo      ollama pull nomic-embed-text
    echo.
    pause
)

REM Navigate to backend and install dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo    Starting TrilokGPT Backend Server
echo ============================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Start server in new window
start http://localhost:8000
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start server
    pause
    exit /b 1
)
