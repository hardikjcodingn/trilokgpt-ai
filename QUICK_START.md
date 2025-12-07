# 🚀 TrilokGPT Quick Start Guide - v2.0.0

## Your Production API Credentials

**API Key (Production):**
```
sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe
```

**API Key (Testing):**
```
sk_214282b4ea27e044afcad6b8f402ef8c056d587ac31c747371d8e2006d091
```

Keep these secure! Use them for all API requests with Bearer token auth.

---

## 5-Minute Setup (Windows)

### 1️⃣ Prerequisites Check
```powershell
node --version    # Should be v18 or higher
python --version  # Should be 3.8 or higher
```

**Need to install?**
- Node.js: https://nodejs.org/
- Python: https://www.python.org/downloads/

### 2️⃣ Install Ollama
Download from: https://ollama.ai

After installation, open PowerShell and download the required models:
```powershell
ollama pull llama2
ollama pull nomic-embed-text
```

### 3️⃣ Install Dependencies
```powershell
cd backend
npm install
```

### 4️⃣ Start the Backend
```powershell
npm start
```

You should see:
```
🚀 TrilokGPT Backend Server v2.0.0 - RUNNING
📍 Server URL: http://localhost:8000
🔐 Security Features:
   ✅ API Key Authentication (Bearer token)
   ✅ Rate Limiting (1000 req/15min global)
```

---

## Testing Your API (5 minutes)

### 1️⃣ Health Check (No Auth Required)
```bash
curl http://localhost:8000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "uptime": 1234.56,
#   "version": "2.0.0"
# }
```

### 2️⃣ Upload a Document (With API Key)
```bash
$API_KEY = "sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe"

curl -X POST http://localhost:8000/api/upload `
  -H "Authorization: Bearer $API_KEY" `
  -F "file=@document.pdf"

# Response:
# {
#   "documentId": "uuid-123",
#   "fileName": "document.pdf",
#   "pageCount": 10,
#   "language": "English"
# }
```

### 3️⃣ Ask a Question (With API Key)
```bash
$API_KEY = "sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe"

curl -X POST http://localhost:8000/api/query `
  -H "Authorization: Bearer $API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"query": "What is the main topic?"}'

# Response:
# {
#   "answer": "The main topic is...",
#   "sources": [
#     {
#       "documentId": "uuid-123",
#       "fileName": "document.pdf",
#       "relevance": 0.95
#     }
#   ]
# }
```

---

## Production Deployment (Choose One)

### Option A: Railway.io (Recommended - 10 minutes)

1. Sign up: https://railway.app
2. Connect GitHub account
3. Create new project
4. Connect your repository
5. Railway auto-detects Node.js and deploys
6. Add Ollama service from Railway marketplace
7. Get your URL: `https://your-app.railway.app`

**Your Production URL:**
```
https://your-app.railway.app/api
```

### Option B: Fly.io (10 minutes)

```bash
# Install Fly CLI
iex "& { $(irm https://fly.io/install.ps1) }"

# Login
flyctl auth login

# Deploy
flyctl launch
flyctl deploy

# Get URL
flyctl info
```

**Your Production URL:**
```
https://your-app.fly.dev/api
```

### Option C: Docker Compose (Any Server)

```bash
# Build and run
docker build -f Dockerfile.prod -t trilokgpt .
docker-compose -f docker-compose.prod.yml up -d

# Access
http://your-server-ip:8000/api
```

---

## Lovable Integration (Paste & Use)

After deploying to production, replace `YOUR_DOMAIN` and `YOUR_API_KEY`:

```javascript
// Add this to your Lovable site (HTML footer or custom code)

const TRILOK_CONFIG = {
  apiUrl: 'https://your-domain.com',  // <- Replace with your domain
  apiKey: 'sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe'
};

// Upload document
async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${TRILOK_CONFIG.apiUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRILOK_CONFIG.apiKey}`
    },
    body: formData
  });
  
  return response.json();
}

// Ask question
async function askQuestion(query) {
  const response = await fetch(`${TRILOK_CONFIG.apiUrl}/api/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRILOK_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  return response.json();
}

// Example usage
uploadDocument(fileInputElement.files[0])
  .then(result => console.log('Uploaded:', result.documentId));

askQuestion("What is this document about?")
  .then(result => console.log('Answer:', result.answer));
```

---

## API Reference

### Endpoints

| Method | Endpoint | Auth | Rate Limit | Purpose |
|--------|----------|------|------------|---------|
| POST | `/api/upload` | ✅ | 100/hour | Upload document |
| POST | `/api/query` | ✅ | 50/min | Ask question |
| GET | `/api/documents` | ✅ | - | List documents |
| DELETE | `/api/documents/{id}` | ✅ | - | Delete document |
| GET | `/health` | ❌ | - | Health check |
| GET | `/config` | ❌ | - | Configuration |

### Authentication
Every API request (except `/health` and `/config`) requires:
```
Authorization: Bearer <API_KEY>
```

### Rate Limits (Per IP)
- **Global**: 1,000 requests per 15 minutes
- **Upload**: 100 uploads per hour
- **Query**: 50 queries per minute
- **Daily Capacity**: 10,000+ requests (supports up to 10,000 users/day)

---

## Environment Variables (.env)

Key configuration variables in `backend/.env`:

```env
# Server
NODE_ENV=production
PORT=8000

# Ollama (Local AI)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
EMBEDDING_MODEL=nomic-embed-text

# Security
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
UPLOAD_LIMIT_MAX=100
QUERY_LIMIT_MAX=50
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
cd backend
npm install --force
```

### "Ollama connection failed"
1. Download Ollama: https://ollama.ai
2. Start Ollama: `ollama serve`
3. Pull models: `ollama pull llama2`
4. Check OLLAMA_URL in .env

### "Invalid API key"
- Use correct format: `Authorization: Bearer sk_xxxxx`
- Don't forget the space between `Bearer` and key
- Check key in `.api-keys.json`

### Port 8000 already in use
```bash
# Find process using port
netstat -ano | findstr :8000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
set PORT=3000 && npm start
```

---

## Support & Documentation

- **Full Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **API Documentation**: `backend/API_DOCUMENTATION.md`
- **Architecture Details**: `DEVELOPMENT.md`
- **Project Overview**: `README.md`

---

## What's Included

✅ Production-ready Node.js backend
✅ Document upload (PDF, DOCX, TXT, Images)
✅ OCR with Tesseract
✅ Vector embeddings with FAISS
✅ Ollama LLM integration
✅ Hindi & English support
✅ API key authentication system
✅ Rate limiting (10,000+ users/day)
✅ Docker containerization
✅ Production deployment configs
✅ Monitoring & health checks
✅ CORS & security headers

---

## Security Features

🔒 **API Key Authentication** - Bearer token validation
🚦 **Rate Limiting** - Per-IP throttling
🛡️ **Security Headers** - Helmet middleware
📦 **Request Compression** - Gzip compression
📝 **Request Logging** - Morgan middleware
🔐 **CORS Protection** - Configurable origins
🌍 **HTTPS Ready** - TLS/SSL support

---

## Next Steps

1. ✅ Start Ollama: `ollama serve`
2. ✅ Start backend: `npm start`
3. ✅ Test API: `curl http://localhost:8000/health`
4. ✅ Upload document: POST `/api/upload`
5. ✅ Ask question: POST `/api/query`
6. ✅ Deploy to production (Railway/Fly.io)
7. ✅ Integrate with Lovable
8. ✅ Scale to 10,000 users!

---

**Ready to go live? Deploy now!** 🚀
