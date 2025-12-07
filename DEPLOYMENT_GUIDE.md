# TrilokGPT Production Deployment Guide v2.0.0

## Overview
This guide covers deploying TrilokGPT to production with:
- API Key authentication system
- Rate limiting (10,000+ users/day)
- HTTPS/TLS encryption
- Docker containerization
- Automated setup
- Lovable integration

---

## Quick Start (Local Testing)

### 1. Prerequisites
- Node.js 18+
- Python 3.8+
- Ollama (https://ollama.ai)

### 2. Automated Setup
```bash
# Windows
setup.bat

# macOS/Linux
./setup.ps1
# or
chmod +x setup.ps1
./setup.ps1
```

### 3. Start Services
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Backend
cd backend
npm start
```

### 4. Access Application
- Web UI: `http://localhost:8000`
- API: `http://localhost:8000/api`
- Health: `http://localhost:8000/health`

---

## API Key System

### Generate New API Key
The setup script automatically generates an initial API key. To create more:

```bash
# In backend directory
node -e "
import('./src/utils/apiKeyManager.js').then(m => {
  const mgr = new m.ApiKeyManager();
  const key = mgr.createKey('My App Key');
  console.log('API Key:', key.key);
});
"
```

### Use API Key in Requests
```bash
# With curl
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'

# With JavaScript
const response = await fetch('http://localhost:8000/api/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'Your question here'
  })
});
```

### API Endpoints

#### 1. Upload Document
```
POST /api/upload
Headers:
  - Authorization: Bearer {API_KEY}
  - Content-Type: multipart/form-data

Body:
  - file: <PDF, DOCX, TXT, or Image>

Response:
{
  "documentId": "uuid",
  "fileName": "document.pdf",
  "pageCount": 10,
  "language": "English"
}
```

#### 2. Query Documents
```
POST /api/query
Headers:
  - Authorization: Bearer {API_KEY}
  - Content-Type: application/json

Body:
{
  "query": "What is the main topic?",
  "language": "english",
  "limit": 5
}

Response:
{
  "answer": "The main topic is...",
  "sources": [
    {
      "documentId": "uuid",
      "fileName": "document.pdf",
      "relevance": 0.95
    }
  ]
}
```

#### 3. Health Check (No Auth Required)
```
GET /health

Response:
{
  "status": "ok",
  "version": "2.0.0",
  "uptime": 1234.56
}
```

---

## Production Deployment

### Option 1: Railway.io (Recommended for Ollama)

#### Setup
```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize project
railway init

# Add Ollama service
railway add # Choose ollama/ollama
```

#### Deploy
```bash
# Deploy backend
railway up

# Set environment variables in Railway dashboard
# - OLLAMA_URL: Internal Ollama URL
# - PORT: 8000
# - NODE_ENV: production

# Get your public URL
railway status
```

#### Access
```
API Base: https://your-app.railway.app/api
Health: https://your-app.railway.app/health
```

### Option 2: Fly.io

#### Setup
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Initialize
flyctl launch --image-label trilokgpt
```

#### Deploy
```bash
flyctl deploy

# Scale to handle 10,000 users
flyctl scale count 5 --max-per-region 5

# Enable autoscaling
flyctl autoscale set min=3 max=10
```

### Option 3: Docker on Your Server

#### Build & Run
```bash
# Build image
docker build -f Dockerfile.prod -t trilokgpt:latest .

# Run with compose
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

#### Configure for 10,000 Users
```yaml
# In docker-compose.prod.yml
services:
  backend:
    environment:
      NODE_ENV: production
      # Tune for 10,000 daily users
      # Rate limit: 1000 req/15min global
      # Per-IP: 50 queries/min, 100 uploads/hour
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## HTTPS Configuration

### Using Let's Encrypt

#### Step 1: Update Nginx Config
```bash
# Update nginx.conf with your domain
# - Replace example.com with your domain
# - Update upstream backend URL if using different domain
```

#### Step 2: Get Certificate
```bash
# Using Certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificate to:
# ./data/certs/your-domain.com.crt
# ./data/certs/your-domain.com.key
```

#### Step 3: Restart Nginx
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Rate Limiting Configuration

### Default Limits
- **Global**: 1000 requests per 15 minutes per IP
- **Upload**: 100 uploads per hour per IP
- **Query**: 50 queries per minute per IP
- **Total Daily Capacity**: ~10,000+ requests per user (depending on distribution)

### Adjust Limits
Edit `backend/src/server.js`:
```javascript
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,  // Increase from 1000
});

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,   // Increase from 50
});
```

---

## Monitoring & Health Checks

### Health Endpoint
```bash
curl http://your-server:8000/health

# Response
{
  "status": "ok",
  "version": "2.0.0",
  "uptime": 3600,
  "environment": "production"
}
```

### Check API Key Status
```bash
# View all keys (requires admin key)
curl -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  http://your-server:8000/api/keys
```

### Monitor Logs
```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f backend

# Railway
railway logs

# Fly.io
flyctl logs
```

---

## Scaling to 10,000 Users

### Architecture
1. **Load Balancer**: Nginx with upstream pool
2. **Backend Cluster**: 5-10 instances based on traffic
3. **Ollama**: Single instance or clustered
4. **Vector DB**: Redis or persistent storage

### Configuration
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up --scale backend=5

# Or using Railway
railway scale backend 5 --max-per-region 5

# Or using Fly.io
flyctl scale count 5
flyctl autoscale set min=3 max=10
```

### Performance Tuning
```bash
# Set ulimit for file descriptors
ulimit -n 65536

# Configure system
echo "fs.file-max = 2097152" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Monitor with
docker stats
```

---

## Lovable Integration

### 1. Get Your Credentials
After deployment:
- **API Base URL**: `https://your-domain.com` or `https://your-app.railway.app`
- **API Key**: From `.api-keys.json` or generated during setup

### 2. Integration Code
```javascript
// Add to your Lovable site
const TRILOK_API_KEY = 'sk_your_key_here';
const TRILOK_API_URL = 'https://your-domain.com/api';

async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${TRILOK_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRILOK_API_KEY}`
    },
    body: formData
  });
  
  return response.json();
}

async function askQuestion(query) {
  const response = await fetch(`${TRILOK_API_URL}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRILOK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  return response.json();
}
```

### 3. Test Integration
```bash
# Test upload
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer sk_your_key" \
  -F "file=@document.pdf"

# Test query
curl -X POST https://your-domain.com/api/query \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is this about?"}'
```

---

## Troubleshooting

### Issue: "Invalid API key"
- Check API key format (should start with `sk_`)
- Verify Bearer token syntax: `Authorization: Bearer sk_xxxxx`
- Check `.api-keys.json` file exists

### Issue: Ollama connection failed
- Ensure Ollama is running: `ollama serve`
- Check OLLAMA_URL in environment
- Pull required models: `ollama pull llama2`

### Issue: Rate limiting
- Check current limits in `server.js`
- Monitor with `redis-cli` if using Redis
- Adjust windowMs and max values as needed

### Issue: High memory usage
- Reduce concurrent Ollama requests
- Scale backend instances instead of single large instance
- Monitor with `docker stats`

---

## Support & Documentation

- **API Reference**: See `backend/API_DOCUMENTATION.md`
- **Architecture**: See `DEVELOPMENT.md`
- **Examples**: See `backend/examples/`
- **Questions**: Check `FAQ.md`

---

## Version History

### v2.0.0 (Current)
- ✅ API Key authentication system
- ✅ Rate limiting (1000 req/15min)
- ✅ Production security (Helmet, CORS, compression)
- ✅ Docker & containerization
- ✅ Railway.io deployment
- ✅ Fly.io deployment
- ✅ Automatic setup scripts
- ✅ Health checks & monitoring

### v1.0.0
- Initial release with OCR, embeddings, LLM

---

Last Updated: 2024
