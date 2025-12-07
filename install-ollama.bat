@echo off
REM Ollama Installation and Setup Script for Windows
REM This script will help you install Ollama and run it

echo.
echo ============================================
echo   TrilokGPT - Ollama Setup Script
echo ============================================
echo.

REM Check if Ollama is already installed
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Ollama is already installed
    echo.
    echo Starting Ollama service and downloading llama2 model...
    echo.
    timeout /t 2
    ollama run llama2
) else (
    echo [INFO] Ollama is not installed yet
    echo.
    echo Please follow these steps:
    echo.
    echo 1. Go to https://ollama.ai/download
    echo 2. Download and run the Windows installer
    echo 3. Complete the installation
    echo 4. After installation, run this script again
    echo.
    echo Opening Ollama download page...
    start https://ollama.ai/download
    echo.
    pause
)
