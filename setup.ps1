#!/usr/bin/env pwsh

<#
.SYNOPSIS
    TrilokGPT Automated Setup & Installation Script
    Works on Windows, macOS, and Linux
.VERSION
    2.0.0
.AUTHOR
    TrilokGPT Team
#>

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TrilokGPT Backend - Automated Setup" -ForegroundColor Cyan
Write-Host "  Version 2.0.0" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = cmd /c "node --version 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Magenta
    exit 1
}
Write-Host "✅ Node.js installed: $nodeCheck" -ForegroundColor Green

# Check Python
Write-Host ""
Write-Host "[2/6] Checking Python 3..." -ForegroundColor Yellow
$pythonCheck = cmd /c "python --version 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python 3 is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download Python 3.8+ from: https://www.python.org/downloads/" -ForegroundColor Magenta
    exit 1
}
Write-Host "✅ Python installed: $pythonCheck" -ForegroundColor Green

# Install Node.js Dependencies
Write-Host ""
Write-Host "[3/6] Installing Node.js dependencies..." -ForegroundColor Yellow
Push-Location "$scriptPath/backend"
if (Test-Path "node_modules") {
    Write-Host "⏭️  node_modules exists, skipping npm install" -ForegroundColor Yellow
} else {
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install npm packages" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Pop-Location

# Setup .env file
Write-Host ""
Write-Host "[4/6] Setting up configuration..." -ForegroundColor Yellow
if (Test-Path "$scriptPath/backend/.env") {
    Write-Host "⏭️  .env already exists, skipping" -ForegroundColor Yellow
} else {
    $envContent = @"
NODE_ENV=production
PORT=8000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
EMBEDDING_MODEL=nomic-embed-text
ALLOWED_ORIGINS=*
ADMIN_API_KEY=admin_sk_changeme123456789
"@
    Set-Content -Path "$scriptPath/backend/.env" -Value $envContent
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Generate API Key
Write-Host ""
Write-Host "[5/6] Generating initial API key..." -ForegroundColor Yellow
Push-Location "$scriptPath/backend"
try {
    $apiKey = node -e "
import('./src/utils/apiKeyManager.js').then(m => {
  const mgr = new m.ApiKeyManager();
  const key = mgr.createKey('Production Key');
  console.log('');
  console.log('🔑 API Key Generated:');
  console.log('   ' + key.key);
  console.log('');
}).catch(e => console.error('Error:', e.message))
" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host $apiKey
    } else {
        Write-Host "⚠️  Could not auto-generate API key" -ForegroundColor Yellow
        Write-Host "You can manually generate one after starting the server" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not auto-generate API key" -ForegroundColor Yellow
}
Pop-Location

# Ollama Setup
Write-Host ""
Write-Host "[6/6] Ollama Configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please ensure Ollama is installed and running:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Download Ollama from: https://ollama.ai" -ForegroundColor White
Write-Host "2. Install and start Ollama service" -ForegroundColor White
Write-Host "3. Pull required models:" -ForegroundColor White
Write-Host ""
Write-Host "   ollama pull llama2" -ForegroundColor Gray
Write-Host "   ollama pull nomic-embed-text" -ForegroundColor Gray
Write-Host ""
Write-Host "Other model options:" -ForegroundColor White
Write-Host "   ollama pull mistral" -ForegroundColor Gray
Write-Host "   ollama pull neural-chat" -ForegroundColor Gray
Write-Host "   ollama pull gemma" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Ollama (in a terminal):" -ForegroundColor White
Write-Host "   ollama serve" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the backend (in another terminal):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open web interface:" -ForegroundColor White
Write-Host "   http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "4. For API requests, use Bearer token:" -ForegroundColor White
Write-Host "   Authorization: Bearer {YOUR_API_KEY}" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - Backend: backend/README.md" -ForegroundColor Gray
Write-Host "   - API Docs: backend/API_DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "   - Config: backend/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
