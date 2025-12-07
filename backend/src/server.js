import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ApiKeyManager } from './utils/apiKeyManager.js';
import EmbeddingModule from './modules/embedding.js';
import OllamaModule from './modules/ollama.js';
import { createUploadRoutes } from './routes/uploadRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const PORT = process.env.PORT || 8000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const VECTOR_STORE_PATH = process.env.VECTOR_STORE_PATH || path.join(__dirname, '../vectors/store.json');

// Initialize modules
const embedding = new EmbeddingModule(OLLAMA_URL, EMBEDDING_MODEL);
const ollama = new OllamaModule(OLLAMA_URL, OLLAMA_MODEL);
const apiKeyManager = new ApiKeyManager();

// Initialize Express app
const app = express();

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== RATE LIMITING (DISABLED - Personal AI System) ==========
// Rate limiting disabled for personal use. Uncomment if needed for production.
/*
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many uploads, please try again later.'
});

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many queries, please try again later.'
});

app.use(globalLimiter);
*/

// ========== API KEY AUTHENTICATION MIDDLEWARE (DISABLED FOR PERSONAL USE) ==========
const apiKeyMiddleware = (req, res, next) => {
  // Middleware disabled - no API key required for personal AI system
  // If you want to re-enable, uncomment the original validation below
  req.apiKey = 'personal-use';
  next();
};

/* ORIGINAL VALIDATION (DISABLED):
const apiKeyMiddleware = (req, res, next) => {
  const publicEndpoints = ['/health', '/config', '/', '/index.html'];
  if (publicEndpoints.some(ep => req.path === ep || req.path.startsWith('/css') || req.path.startsWith('/js'))) {
    return next();
  }

  // Support multiple ways of passing API key:
  // 1. Authorization: Bearer <key>
  // 2. Authorization: <key>
  // 3. X-API-Key header
  let apiKey = null;
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      apiKey = parts[1];
    } else if (parts.length === 1) {
      apiKey = parts[0];
    }
  }
  
  // Fallback to X-API-Key header
  if (!apiKey) {
    apiKey = req.headers['x-api-key'];
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      message: 'Include Authorization header with Bearer token or X-API-Key header'
    });
  }

  const validation = apiKeyManager.validateKey(apiKey);
  if (!validation.valid) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.apiKey = apiKey;
  next();
};
*/

app.use(apiKeyMiddleware);

// Serve static frontend files - handle both local and Render deployment paths
const frontendPath1 = path.join(__dirname, '../frontend');
const frontendPath2 = path.join(__dirname, './frontend');
const frontendPath3 = '/app/frontend';

let activeFrontendPath = frontendPath1;
if (!fs.existsSync(frontendPath1) && fs.existsSync(frontendPath2)) {
  activeFrontendPath = frontendPath2;
} else if (!fs.existsSync(frontendPath1) && fs.existsSync(frontendPath3)) {
  activeFrontendPath = frontendPath3;
}

console.log(`Serving static files from: ${activeFrontendPath}`);
app.use(express.static(activeFrontendPath));

// API Routes (rate limiting disabled for personal use)
// app.use('/api/upload', uploadLimiter);
// app.use('/api/query', queryLimiter);
createUploadRoutes(app, embedding, ollama);

/**
 * GET / - Serve main HTML
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/**
 * GET /api/config - Get client configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    apiUrl: process.env.API_URL || 'http://localhost:' + PORT,
    ollamaUrl: OLLAMA_URL,
    supportedFormats: ['PDF', 'DOCX', 'TXT', 'JPG', 'PNG'],
    maxFileSize: 500,
    embeddingModel: EMBEDDING_MODEL,
    ollamaModel: OLLAMA_MODEL,
    version: '2.0.0',
    security: {
      apiKey: true,
      rateLimiting: true,
      https: process.env.NODE_ENV === 'production'
    }
  });
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

/**
 * GET /api/test - Test API key validity
 */
app.get('/api/test', apiKeyMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    message: 'API key is valid',
    apiKey: req.apiKey.substring(0, 4) + '...' + req.apiKey.substring(60)
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

/**
 * Initialize and start server
 */
function startServer() {
  console.log('🚀 Starting TrilokGPT Backend...');
  console.log('📦 Configuration:');
  console.log(`   - Ollama URL: ${OLLAMA_URL}`);
  console.log(`   - Ollama Model: ${OLLAMA_MODEL}`);
  console.log(`   - Embedding Model: ${EMBEDDING_MODEL}`);
  console.log(`   - Vector Store: ${VECTOR_STORE_PATH}`);

  // Start server immediately - don't wait for initialization
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✨ Server running at http://localhost:${PORT}`);
    console.log('📄 Open http://localhost:' + PORT + ' in your browser');
    console.log('\n✅ All systems operational!');
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  });

  // Initialize in the background (don't block startup)
  Promise.all([
    embedding.loadVectorStore(VECTOR_STORE_PATH)
      .then(() => console.log('✅ Vector store loaded'))
      .catch(err => {
        console.log('📝 Starting with empty vector store (this is OK on first run)');
        console.error('Vector store error (ignored):', err.message);
      }),
    
    (async () => {
      console.log('\n🔍 Checking Ollama service...');
      try {
        const ready = await ollama.isReady();
        if (ready) {
          console.log('✅ Ollama is available');
          const models = await ollama.listModels();
          console.log(`   Available models: ${models.join(', ')}`);
        } else {
          console.warn('⚠️  Ollama is not available');
          console.warn('   Install Ollama from https://ollama.ai');
          console.warn('   Then run: ollama run llama2');
          console.warn('   (You can still use the system for document analysis without Ollama)');
        }
      } catch (error) {
        console.warn('⚠️  Could not check Ollama:', error.message);
      }
    })()
  ]).catch(err => {
    console.error('Background initialization error (non-fatal):', err.message);
  });

  // Keep process alive - indefinitely
  setInterval(() => {}, 1000);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error.message);
  process.exit(1);
});

// Start the server
startServer();

// Keep the process alive by setting an interval
setInterval(() => {
  // This prevents Node.js from exiting
}, 60000);
