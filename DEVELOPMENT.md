# 🔨 TrilokGPT Development Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                      │
│  HTML/CSS/JS - Chat UI, File Upload, Results Display         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────────┐
│                  Express.js Backend                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Routes: Upload, Query, Documents, Health            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ OCR Module   │ Document     │ Embedding Module     │    │
│  │ (Tesseract)  │ Extractor    │ (Ollama)             │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Text Chunker │ Ollama Module│ Language Detector    │    │
│  │              │ (Llama3)     │                      │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ Local Services
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐          ┌────────▼────┐
    │ Ollama  │          │    File     │
    │ (LLM)   │          │   Storage   │
    │         │          │  & Vectors  │
    └─────────┘          └─────────────┘
```

## Core Modules

### 1. **OCR Module** (`src/modules/ocr.js`)
- Uses Tesseract.js for text extraction from images
- Supports: JPG, PNG, TIFF, BMP
- Features: Image preprocessing, batch processing

**Key Methods:**
```javascript
await OCRModule.initialize()           // Initialize worker
await OCRModule.extractText(path, lang) // Extract from image
await OCRModule.preprocessImage(in, out) // Improve image quality
```

### 2. **Document Extractor** (`src/modules/documentExtractor.js`)
- Extracts text from documents
- Supports: PDF, DOCX, TXT

**Key Methods:**
```javascript
DocumentExtractor.extract(filePath)      // Auto-detect & extract
DocumentExtractor.extractFromPDF(path)   // PDF extraction
DocumentExtractor.extractFromDOCX(path)  // DOCX extraction
```

### 3. **Text Chunker** (`src/modules/textChunker.js`)
- Splits text into embeddings-friendly chunks
- Strategies: token-based, sentence-based, paragraph-based

**Key Methods:**
```javascript
TextChunker.smartChunk(text, maxTokens, overlap)
TextChunker.chunkByTokens(text, size, overlap)
TextChunker.chunkBySentences(text, sentenceCount, overlap)
TextChunker.getStats(chunks)  // Get chunk statistics
```

### 4. **Embedding Module** (`src/modules/embedding.js`)
- Vectorizes text using Ollama embeddings
- Implements cosine similarity for search
- Manages vector store (FAISS-like)

**Key Methods:**
```javascript
await embedding.generateEmbedding(text)       // Single embedding
await embedding.generateEmbeddingsBatch(chunks) // Batch
await embedding.addDocument(docId, chunks, embeddings, meta)
await embedding.query(question, topK)         // Search
embedding.similaritySearch(vector, topK)      // Cosine similarity
await embedding.saveVectorStore(path)         // Persist
await embedding.loadVectorStore(path)         // Load
```

### 5. **Ollama Module** (`src/modules/ollama.js`)
- Interfaces with Ollama for LLM inference
- Implements RAG (Retrieval-Augmented Generation)
- Supports streaming responses

**Key Methods:**
```javascript
await ollama.isReady()                    // Check service
await ollama.listModels()                 // Available models
await ollama.generate(prompt, options)    // Generate response
await ollama.generateStream(prompt, callback) // Streaming
await ollama.generateRAGAnswer(question, contexts, lang)
await ollama.detectLanguage(text)         // Language detection
await ollama.summarize(text, length)      // Summarization
```

## API Endpoints

### Upload & Management
```
POST   /api/upload           - Upload file (multipart/form-data)
GET    /api/documents        - List all documents
GET    /api/documents/:id    - Get document details
DELETE /api/documents/:id    - Delete document
```

### Query
```
POST   /api/query            - Ask question about documents
```

Request body:
```json
{
  "question": "What is...?",
  "topK": 5,
  "useOllama": true
}
```

Response:
```json
{
  "question": "...",
  "language": "en",
  "answer": "...",
  "relevantChunks": [
    {
      "text": "...",
      "similarity": 0.85,
      "docId": "..."
    }
  ],
  "source": "ollama_rag|embedding_only|no_match"
}
```

### System
```
GET    /api/health           - System health status
GET    /api/config           - Client configuration
```

## Extending the System

### Add a New Document Type

1. **Add extractor method** in `src/modules/documentExtractor.js`:
```javascript
static async extractFromXLSX(filePath) {
  // Implementation using library like xlsx
  return extractedText;
}
```

2. **Add MIME type** in `src/utils/fileManager.js`:
```javascript
export const SUPPORTED_TYPES = {
  // ... existing types
  XLSX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};
```

3. **Update API** to call new extractor in `src/routes/uploadRoutes.js`

### Implement Custom Embedding Model

1. **Create new embedding module**:
```javascript
// src/modules/customEmbedding.js
import axios from 'axios';

export class CustomEmbedding {
  async generateEmbedding(text) {
    // Call your embedding API/service
    const response = await axios.post('YOUR_API_URL', { text });
    return response.data.embedding;
  }
}
```

2. **Use in server.js**:
```javascript
const embedding = new CustomEmbedding();
```

### Add Vector Database Persistence

Replace JSON-based storage with actual FAISS:

```javascript
// src/modules/faissDB.js
import FAISS from 'faiss-node';

export class FAISSDatabase {
  constructor() {
    this.index = null;
  }

  async addVectors(vectors, metadata) {
    // FAISS implementation
  }

  async search(query, topK) {
    // Search implementation
  }

  async save(path) {
    // Save to disk
  }
}
```

### Add LLM Providers

```javascript
// src/modules/providers/anthropic.js
export class AnthropicProvider {
  async generate(prompt) {
    // Anthropic API implementation
  }
}

// Use in server.js
import { AnthropicProvider } from './modules/providers/anthropic.js';
const llm = new AnthropicProvider();
```

### Add Web Interface Features

New UI features in `frontend/js/app.js`:

```javascript
// Add voice input
async addVoiceInput() {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('questionInput').value = transcript;
  };
  recognition.start();
}

// Add export results
async exportResults(format = 'pdf') {
  // Export implementation
}

// Add multi-language UI
async switchLanguage(lang) {
  // i18n implementation
}
```

## Testing

### Manual Testing
1. Upload test documents
2. Query with various questions
3. Check browser console for errors
4. Check terminal for backend logs

### Unit Tests Example
```javascript
// test/embedding.test.js
import { EmbeddingModule } from '../src/modules/embedding.js';

describe('Embedding Module', () => {
  let embedding;

  beforeEach(() => {
    embedding = new EmbeddingModule();
  });

  test('should generate embedding', async () => {
    const vec = await embedding.generateEmbedding('test');
    expect(vec).toHaveLength(384); // nomic-embed-text dimension
  });

  test('cosine similarity', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const similarity = embedding.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(1.0);
  });
});
```

## Performance Optimization

### Chunking Strategy
```javascript
// Larger chunks = fewer API calls, larger context
TextChunker.smartChunk(text, 1000, 100)

// Smaller chunks = faster search, more granular
TextChunker.smartChunk(text, 300, 30)
```

### Caching
```javascript
// Add Redis/in-memory cache
const cache = new Map();

async function getCachedEmbedding(text) {
  if (cache.has(text)) return cache.get(text);
  const embedding = await generateEmbedding(text);
  cache.set(text, embedding);
  return embedding;
}
```

### Batch Processing
```javascript
// Process files in parallel (with limits)
const pLimit = (await import('p-limit')).default;
const limit = pLimit(3); // 3 concurrent

const results = await Promise.all(
  chunks.map((chunk) => limit(() => generateEmbedding(chunk)))
);
```

## Deployment Checklist

- [ ] Change `API_URL` to production domain
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging to file
- [ ] Set up monitoring/alerting
- [ ] Test file upload limits
- [ ] Configure CORS properly
- [ ] Use process manager (PM2)
- [ ] Set up reverse proxy (Nginx)

## Useful Dependencies to Add

```bash
# Database
npm install mongoose sqlite3 pg

# Authentication
npm install jsonwebtoken bcryptjs passport

# API Documentation
npm install swagger-jsdoc swagger-ui-express

# Testing
npm install jest supertest

# Monitoring
npm install winston pino

# Performance
npm install redis p-limit

# File processing
npm install sharp imagemin ffmpeg-fluent
```

## Resources

- [Express.js Docs](https://expressjs.com/)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)
- [FAISS Documentation](https://github.com/facebookresearch/faiss/wiki)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Happy developing! 🚀**
