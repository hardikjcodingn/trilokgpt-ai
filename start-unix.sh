#!/bin/bash

# TrilokGPT Quick Start Script for macOS/Linux

echo ""
echo "============================================"
echo "    TrilokGPT - AI Document Q&A System"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please download and install from: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js is installed"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed"
    exit 1
fi

echo "[OK] npm is installed"
npm --version
echo ""

# Check if Ollama is running
echo "Checking Ollama service..."
sleep 1

if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "[WARNING] Ollama is not running!"
    echo "Please start Ollama before running the server:"
    echo "  1. In a terminal, run: ollama serve"
    echo "  2. In another terminal, download models:"
    echo "     ollama pull llama2"
    echo "     ollama pull nomic-embed-text"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

echo ""
echo "Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "============================================"
echo "    Starting TrilokGPT Backend Server"
echo "============================================"
echo ""

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open http://localhost:8000
fi

# Open browser (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sleep 2
    xdg-open http://localhost:8000 &
fi

npm start

exit 0
