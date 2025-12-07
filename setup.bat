@echo off
REM ========================================
REM TrilokGPT Automated Setup & Installation
REM For Windows (PowerShell)
REM ========================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ============================================================
echo   TrilokGPT Backend - Automated Setup for Windows
echo   Version 2.0.0
echo ============================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator
    echo.
    pause
    exit /b 1
)

REM ========================================
REM 1. Check Node.js Installation
REM ========================================
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo Please download and install Node.js 18+ from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js is installed: 
node --version

REM ========================================
REM 2. Check Python Installation
REM ========================================
echo.
echo [2/6] Checking Python 3...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Python 3 is not installed
    echo.
    echo Please download and install Python 3.8+ from:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo ✅ Python is installed:
python --version

REM ========================================
REM 3. Install Node.js Dependencies
REM ========================================
echo.
echo [3/6] Installing Node.js dependencies...
cd backend
if exist node_modules (
    echo ⏭️  node_modules already exists, skipping npm install
) else (
    npm install --production
    if %errorLevel% neq 0 (
        echo ❌ Failed to install npm packages
        pause
        exit /b 1
    )
)
echo ✅ Node.js dependencies installed
cd ..

REM ========================================
REM 4. Create .env Configuration File
REM ========================================
echo.
echo [4/6] Setting up configuration...
if exist backend\.env (
    echo ⏭️  .env already exists, skipping
) else (
    echo Creating .env file...
    (
        echo NODE_ENV=production
        echo PORT=8000
        echo OLLAMA_URL=http://localhost:11434
        echo OLLAMA_MODEL=llama2
        echo EMBEDDING_MODEL=nomic-embed-text
        echo ALLOWED_ORIGINS=*
    ) > backend\.env
    echo ✅ .env file created
)

REM ========================================
REM 5. Generate Initial API Key
REM ========================================
echo.
echo [5/6] Generating initial API key...
cd backend
node -e "import('./src/utils/apiKeyManager.js').then(m => { const mgr = new m.ApiKeyManager(); const key = mgr.createKey('Production Key'); console.log(''); console.log('🔑 API Key Generated:'); console.log('   ' + key.key); console.log(''); console.log('Store this key safely - you will need it for API requests'); console.log(''); })" 2>nul
if %errorLevel% neq 0 (
    echo ⚠️  Could not auto-generate API key
    echo You can manually generate one after starting the server
)
cd ..
echo.

REM ========================================
REM 6. Ollama Setup Instructions
REM ========================================
echo [6/6] Ollama Configuration
echo.
echo Please ensure Ollama is installed and running:
echo.
echo 1. Download Ollama from: https://ollama.ai
echo 2. Install and start Ollama
echo 3. Pull required models by running in PowerShell/CMD:
echo.
echo    ollama pull llama2
echo    ollama pull nomic-embed-text
echo.
echo Or use other models (supports Llama3, Mistral, Gemma, etc.):
echo.
echo    ollama pull mistral
echo    ollama pull neural-chat
echo.

REM ========================================
REM Setup Complete
REM ========================================
echo.
echo ============================================================
echo ✅ Setup Complete!
echo ============================================================
echo.
echo Next Steps:
echo.
echo 1. Start Ollama (if not running):
echo    ollama serve
echo.
echo 2. In another terminal, start the backend:
echo    cd backend
echo    npm start
echo.
echo 3. Access the web interface:
echo    http://localhost:8000
echo.
echo 4. For API requests, include Authorization header:
echo    Authorization: Bearer {YOUR_API_KEY}
echo.
echo Documentation:
echo   - Backend API: See backend/README.md
echo   - API Reference: backend/API_DOCUMENTATION.md
echo   - Environment variables: backend/.env
echo.
echo ============================================================
echo.

pause
