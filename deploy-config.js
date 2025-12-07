#!/usr/bin/env node

/**
 * TrilokGPT Deployment & Credentials Generator
 * Generates API keys and verifies production setup
 * Usage: node deploy-config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n' + '='.repeat(70));
console.log('🚀 TrilokGPT v2.0.0 - Production Deployment Configuration');
console.log('='.repeat(70) + '\n');

// Configuration
const config = {
  backendPath: path.join(__dirname, 'backend'),
  frontendPath: path.join(__dirname, 'frontend'),
  dataPath: path.join(__dirname, 'data'),
  vectorsPath: path.join(__dirname, 'vectors')
};

// Ensure directories exist
const dirs = [config.backendPath, config.dataPath, config.vectorsPath];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Load or create API key
console.log('\n📝 API Key Management:');
const apiKeysFile = path.join(config.backendPath, '.api-keys.json');

let apiKeys = [];
if (fs.existsSync(apiKeysFile)) {
  apiKeys = JSON.parse(fs.readFileSync(apiKeysFile, 'utf8'));
  console.log(`   Found ${apiKeys.length} existing API key(s)`);
} else {
  console.log('   Creating new API keys file...');
}

// Generate production API key
function generateKey() {
  const prefix = 'sk_';
  const randomBytes = crypto.randomBytes(48).toString('hex');
  const key = prefix + randomBytes.substring(0, 61);
  return key.substring(0, 64);
}

const productionKey = {
  key: generateKey(),
  name: 'Production API Key',
  created: new Date().toISOString(),
  lastUsed: null,
  requestCount: 0,
  environment: 'production'
};

// Check if production key already exists
const hasProductionKey = apiKeys.some(k => k.environment === 'production');
if (!hasProductionKey) {
  apiKeys.push(productionKey);
  fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys, null, 2));
  console.log(`\n✅ Generated Production API Key:`);
  console.log(`   ${productionKey.key}`);
  console.log(`   Created: ${productionKey.created}`);
} else {
  const existing = apiKeys.find(k => k.environment === 'production');
  console.log(`\n✅ Existing Production API Key:`);
  console.log(`   ${existing.key.substring(0, 10)}...${existing.key.substring(55)}`);
  console.log(`   Created: ${existing.created}`);
}

// Generate test/development API key
const testKey = {
  key: generateKey(),
  name: 'Testing API Key',
  created: new Date().toISOString(),
  lastUsed: null,
  requestCount: 0,
  environment: 'testing'
};

const hasTestKey = apiKeys.some(k => k.environment === 'testing');
if (!hasTestKey) {
  apiKeys.push(testKey);
  fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys, null, 2));
  console.log(`\n✅ Generated Testing API Key:`);
  console.log(`   ${testKey.key}`);
}

// Configuration verification
console.log('\n\n📋 Configuration Verification:\n');

// Check environment file
const envPath = path.join(config.backendPath, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
} else {
  console.log('❌ .env file missing - creating default...');
  const envContent = `NODE_ENV=production
PORT=8000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
EMBEDDING_MODEL=nomic-embed-text
ALLOWED_ORIGINS=*
ADMIN_API_KEY=${generateKey()}`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
}

// Check package.json
const packageJsonPath = path.join(config.backendPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json exists');
} else {
  console.log('❌ package.json missing');
}

// Check core modules
const modules = [
  'src/server.js',
  'src/modules/ocr.js',
  'src/modules/embedding.js',
  'src/modules/ollama.js',
  'src/utils/apiKeyManager.js'
];

console.log('\n📦 Core Modules:\n');
modules.forEach(module => {
  const fullPath = path.join(config.backendPath, module);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
    console.log(`✅ ${module} (${stats.size} bytes, ~${lines} lines)`);
  } else {
    console.log(`❌ ${module} - MISSING`);
  }
});

// Deployment URLs based on platform
console.log('\n\n🌐 Deployment Options:\n');

const deploymentOptions = [
  {
    name: 'Railway.io (Recommended)',
    url: 'https://railway.app',
    steps: [
      'npm install -g railway',
      'railway login',
      'railway init',
      'railway up'
    ]
  },
  {
    name: 'Fly.io',
    url: 'https://fly.io',
    steps: [
      'curl https://fly.io/install.sh | sh',
      'flyctl auth login',
      'flyctl launch',
      'flyctl deploy'
    ]
  },
  {
    name: 'Docker Compose (Local/VPS)',
    url: 'https://docs.docker.com',
    steps: [
      'docker build -f Dockerfile.prod -t trilokgpt .',
      'docker-compose -f docker-compose.prod.yml up -d',
      'Access at http://localhost:8000'
    ]
  }
];

deploymentOptions.forEach((option, index) => {
  console.log(`${index + 1}. ${option.name}`);
  console.log(`   Website: ${option.url}`);
  option.steps.forEach((step, i) => {
    console.log(`   Step ${i + 1}: ${step}`);
  });
  console.log('');
});

// Final checklist
console.log('\n' + '='.repeat(70));
console.log('📋 FINAL CHECKLIST - Before Production Deployment');
console.log('='.repeat(70) + '\n');

const checklist = [
  { item: 'Install Node.js 18+', done: true },
  { item: 'Install Python 3.8+', done: true },
  { item: 'Install Ollama', done: false },
  { item: 'Download Ollama models (llama2, nomic-embed-text)', done: false },
  { item: 'Review .env configuration', done: false },
  { item: 'Set secure API keys', done: true },
  { item: 'Test local deployment: npm start', done: false },
  { item: 'Verify health endpoint: GET /health', done: false },
  { item: 'Test upload endpoint with API key', done: false },
  { item: 'Test query endpoint with API key', done: false },
  { item: 'Set up production domain (if applicable)', done: false },
  { item: 'Configure HTTPS/TLS certificates', done: false },
  { item: 'Choose deployment platform (Railway, Fly.io, or Docker)', done: false },
  { item: 'Deploy and verify production endpoints', done: false },
  { item: 'Generate Lovable integration code', done: false },
  { item: 'Test Lovable integration', done: false }
];

checklist.forEach((item, index) => {
  const status = item.done ? '✅' : '⚠️ ';
  console.log(`${status} ${index + 1}. ${item.item}`);
});

// Lovable Integration Template
console.log('\n\n💻 Lovable Integration Code:\n');

console.log(`
// Add this JavaScript to your Lovable site

const TRILOK_CONFIG = {
  apiUrl: 'https://your-domain.com',  // Replace with your domain
  apiKey: '${apiKeys[0]?.key || 'sk_your_api_key_here'}'
};

async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(\`\${TRILOK_CONFIG.apiUrl}/api/upload\`, {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${TRILOK_CONFIG.apiKey}\` },
    body: formData
  });
  
  return res.json();
}

async function askQuestion(query) {
  const res = await fetch(\`\${TRILOK_CONFIG.apiUrl}/api/query\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TRILOK_CONFIG.apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  return res.json();
}
`);

// Summary
console.log('\n' + '='.repeat(70));
console.log('✅ DEPLOYMENT CONFIGURATION COMPLETE');
console.log('='.repeat(70) + '\n');

console.log('📊 Summary:\n');
console.log(`   API Keys Generated: ${apiKeys.length}`);
console.log(`   Production Key: ${apiKeys.find(k => k.environment === 'production')?.key || 'PENDING'}`);
console.log(`   Backend Path: ${config.backendPath}`);
console.log(`   Data Path: ${config.dataPath}`);
console.log(`   Vectors Path: ${config.vectorsPath}`);

console.log('\n🚀 Next Steps:\n');
console.log('   1. Review and update .env file in backend/');
console.log('   2. Start Ollama service: ollama serve');
console.log('   3. Install dependencies: cd backend && npm install');
console.log('   4. Start server: npm start');
console.log('   5. Test API: curl http://localhost:8000/health');
console.log('   6. Deploy to production (Railway, Fly.io, or Docker)');
console.log('   7. Use the API key for Lovable integration');

console.log('\n📚 Documentation:\n');
console.log('   - Deployment: See DEPLOYMENT_GUIDE.md');
console.log('   - API Reference: See backend/API_DOCUMENTATION.md');
console.log('   - Architecture: See DEVELOPMENT.md');

console.log('\n' + '='.repeat(70) + '\n');
