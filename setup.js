#!/usr/bin/env node

/**
 * TrilokGPT Setup Wizard
 * Interactive setup script for Windows, Mac, and Linux
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(50), 'cyan');
  log('  ' + title, 'cyan');
  log('='.repeat(50) + '\n', 'cyan');
}

async function checkCommand(command, displayName = command) {
  return new Promise((resolve) => {
    const child = spawn('which', [command]);
    let found = false;

    child.on('close', (code) => {
      if (code === 0) {
        log(`✓ ${displayName} is installed`, 'green');
        found = true;
      } else {
        log(`✗ ${displayName} is NOT installed`, 'red');
      }
      resolve(found);
    });

    child.on('error', () => {
      log(`✗ ${displayName} is NOT installed`, 'red');
      resolve(false);
    });
  });
}

async function setup() {
  logSection('TrilokGPT Setup Wizard');

  log('Welcome to TrilokGPT - Free AI Document Q&A System!', 'bright');
  log('This wizard will help you set up the system.\n', 'yellow');

  // Check prerequisites
  logSection('Step 1: Checking Prerequisites');

  let allGood = true;

  const nodeInstalled = await checkCommand('node', 'Node.js');
  const npmInstalled = await checkCommand('npm', 'npm');

  if (!nodeInstalled || !npmInstalled) {
    log('\nPlease install Node.js from https://nodejs.org/', 'red');
    allGood = false;
  }

  const ollamaInstalled = await checkCommand('ollama', 'Ollama');
  if (!ollamaInstalled) {
    log('\nPlease install Ollama from https://ollama.ai/', 'yellow');
  }

  if (!allGood) {
    log('\nPlease install missing prerequisites and try again.', 'red');
    process.exit(1);
  }

  // Setup backend
  logSection('Step 2: Setting Up Backend');

  const backendDir = path.join(__dirname, 'backend');
  const envFile = path.join(backendDir, '.env');
  const exampleEnvFile = path.join(backendDir, '.env.example');

  // Create .env if doesn't exist
  if (!fs.existsSync(envFile) && fs.existsSync(exampleEnvFile)) {
    log('Creating .env file from example...', 'blue');
    fs.copyFileSync(exampleEnvFile, envFile);
    log('✓ .env file created', 'green');
  }

  // Install dependencies
  log('\nInstalling npm dependencies...', 'blue');
  log('(This may take a few minutes)\n', 'yellow');

  return new Promise((resolve) => {
    const npm = spawn('npm', ['install'], {
      cwd: backendDir,
      stdio: 'inherit',
    });

    npm.on('close', (code) => {
      if (code === 0) {
        log('\n✓ Dependencies installed successfully', 'green');
        resolve(true);
      } else {
        log('\n✗ Failed to install dependencies', 'red');
        resolve(false);
      }
    });
  }).then((success) => {
    if (!success) {
      log('\nPlease try running: cd backend && npm install', 'yellow');
      process.exit(1);
    }

    // Setup complete
    logSection('Setup Complete! 🎉');

    log('Next steps:', 'bright');
    log('\n1. Start Ollama (if not running):', 'yellow');
    log('   ollama serve\n', 'cyan');

    log('2. In another terminal, download models (one-time):', 'yellow');
    log('   ollama pull llama2', 'cyan');
    log('   ollama pull nomic-embed-text\n', 'cyan');

    log('3. Start the TrilokGPT server:', 'yellow');
    log('   cd backend', 'cyan');
    log('   npm start\n', 'cyan');

    log('4. Open in browser:', 'yellow');
    log('   http://localhost:8000\n', 'cyan');

    log('For more help, see README.md or QUICKSTART.md', 'blue');
    log('Happy analyzing! 🚀\n', 'green');
  });
}

// Run setup
setup().catch((error) => {
  log(`\nError: ${error.message}`, 'red');
  process.exit(1);
});
