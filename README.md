# TrilokGPT v2.0.0 - Production AI Backend System

Complete open-source AI document analysis system with OCR, embeddings, and LLM integration. **Supports 10,000+ daily users with built-in API key authentication, rate limiting, and production deployment.**

##  System Status

 **COMPLETE & PRODUCTION-READY**
- All core modules implemented
- API key system configured
- Rate limiting enabled
- Docker containerization ready
- Deployment platforms configured

##  Your API Credentials

**Save these credentials securely!**

**Production API Key:**
`
sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe
`

**Testing API Key:**
`
sk_214282b4ea27e044afcad6b8f402ef8c056d587ac31c747371d8e2006d091
`

##  Quick Start (5 Minutes)

### 1. Prerequisites
`powershell
node --version    # Need 18+
python --version  # Need 3.8+
`

Download Ollama: https://ollama.ai
`powershell
ollama pull llama2
ollama pull nomic-embed-text
`

### 2. Start Backend
`powershell
cd backend
npm install
npm start
`

### 3. Open http://localhost:8000

##  Documentation

| Guide | Purpose |
|-------|---------|
| **[QUICK_START.md](./QUICK_START.md)** | 5-minute local setup |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Production deployment |
| **[API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)** | API reference |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Architecture |

##  API Examples

### Health Check
`ash
curl http://localhost:8000/health
`

### Upload Document
`ash
curl -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe" \
  -F "file=@document.pdf"
`

### Ask Question
`ash
curl -X POST http://localhost:8000/api/query \
  -H "Authorization: Bearer sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this about?"}'
`

##  Deploy to Production

### Railway.io (Recommended)
`ash
npm install -g railway
railway login
railway init
railway up
`

### Fly.io
`ash
curl https://fly.io/install.sh | sh
flyctl auth login
flyctl launch
flyctl deploy
`

### Docker
`ash
docker-compose -f docker-compose.prod.yml up -d
`

##  Lovable Integration

`javascript
const API_URL = 'https://your-domain.com';
const API_KEY = 'sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe';

async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetch(\\/api/upload\, {
    method: 'POST',
    headers: { 'Authorization': \Bearer \\ },
    body: formData
  }).then(r => r.json());
}

async function askQuestion(query) {
  return fetch(\\/api/query\, {
    method: 'POST',
    headers: {
      'Authorization': \Bearer \\,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  }).then(r => r.json());
}
`

##  Security Features

- **API Key Authentication** - Bearer token validation
- **Rate Limiting** - 1000 req/15min global + per-endpoint limits
- **CORS Protection** - Configurable allowed origins
- **Security Headers** - Helmet middleware
- **HTTPS Ready** - TLS/SSL support
- **Request Logging** - Morgan middleware

##  Architecture

**Tech Stack:**
- Backend: Node.js + Express.js
- OCR: Tesseract.js
- Embeddings: Ollama (nomic-embed-text)
- Vector DB: FAISS (local JSON storage)
- LLM: Ollama (Llama2, Mistral, Gemma)
- Deployment: Docker, Railway, Fly.io

**Rate Limits (10,000+ users/day):**
- Global: 1,000 requests/15 minutes
- Upload: 100 uploads/hour per IP
- Query: 50 queries/minute per IP

##  Features

 Document upload (PDF, DOCX, TXT, Images)
 OCR with Tesseract
 Vector embeddings with Ollama
 FAISS vector database
 AI-powered Q&A with LLM
 Hindi & English support
 API key authentication
 Rate limiting
 Docker containerization
 Production deployment
 Health checks
 Comprehensive documentation

##  What's Included

- Complete Node.js backend with 5 core modules
- HTML5/CSS3/JS frontend
- API key generation & validation system
- Rate limiting middleware
- Docker & Docker Compose configs
- Railway & Fly.io deployment configs
- Automated setup scripts
- Complete documentation & guides

##  Next Steps

1.  Prerequisites installed (Node.js, Python, Ollama)
2.  Dependencies: \
pm install\
3.  Start Ollama: \ollama serve\
4.  Start backend: \
pm start\
5.  Open http://localhost:8000
6.  Deploy to production
7.  Integrate with Lovable

##  Learn More

- **Quick Start**: See [QUICK_START.md](./QUICK_START.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **API Docs**: See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
- **Architecture**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

---

**Built with  for document AI. Ready to scale to 10,000 users.**

MIT License - Open source and free to use
