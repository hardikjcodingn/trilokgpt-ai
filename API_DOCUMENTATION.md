# 🔌 TrilokGPT API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
No authentication required. The system is designed for local use.

---

## 📤 Upload Endpoints

### Upload a Document
**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request:**
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@document.pdf"
```

**Response (202 Accepted):**
```json
{
  "status": "processing",
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "fileId": "550e8400-e29b-41d4-a716-446655440001",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "fileType": "PDF",
  "message": "File uploaded. Processing text extraction..."
}
```

**Supported File Types:**
- PDF (.pdf)
- DOCX (.docx)
- DOC (.doc)
- TXT (.txt)
- JPG/JPEG (.jpg, .jpeg)
- PNG (.png)
- TIFF (.tiff)

**Constraints:**
- Max file size: 500MB
- Only one file per request

**Async Processing:**
Documents are processed asynchronously. The response returns immediately while processing continues in the background.

---

## 📚 Document Management Endpoints

### List All Documents
**Endpoint:** `GET /api/documents`

**Response:**
```json
{
  "totalDocuments": 2,
  "documents": [
    {
      "docId": "550e8400-e29b-41d4-a716-446655440000",
      "fileInfo": {
        "fileId": "550e8400-e29b-41d4-a716-446655440001",
        "originalName": "document.pdf",
        "fileName": "550e8400.pdf",
        "mimeType": "application/pdf",
        "size": 1048576,
        "uploadedAt": "2024-12-07T10:30:00.000Z"
      },
      "fileType": "PDF",
      "language": "en",
      "languageConfidence": 0.95,
      "extractedTextLength": 15000,
      "chunkCount": 8,
      "processedAt": "2024-12-07T10:30:05.000Z",
      "extractedTextPreview": "This is the first 500 characters of the document..."
    }
  ],
  "vectorStats": {
    "totalDocuments": 2,
    "totalChunks": 15,
    "documents": [
      {
        "docId": "550e8400-e29b-41d4-a716-446655440000",
        "fileName": "document.pdf",
        "chunkCount": 8,
        "language": "en"
      }
    ]
  }
}
```

---

### Get Document Details
**Endpoint:** `GET /api/documents/:docId`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| docId | string | Document ID from upload response |

**Response:**
```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "fileInfo": {
    "fileId": "550e8400-e29b-41d4-a716-446655440001",
    "originalName": "document.pdf",
    "fileName": "550e8400.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "uploadedAt": "2024-12-07T10:30:00.000Z"
  },
  "fileType": "PDF",
  "language": "en",
  "languageConfidence": 0.95,
  "extractedTextLength": 15000,
  "chunkCount": 8,
  "processedAt": "2024-12-07T10:30:05.000Z",
  "extractedTextPreview": "This is the first 500 characters..."
}
```

**Status Codes:**
- 200 OK - Document found
- 404 Not Found - Document not found

---

### Delete a Document
**Endpoint:** `DELETE /api/documents/:docId`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| docId | string | Document ID |

**Response:**
```json
{
  "success": true,
  "message": "Document deleted"
}
```

**Status Codes:**
- 200 OK - Document deleted
- 404 Not Found - Document not found

---

## 💬 Query Endpoint

### Ask a Question
**Endpoint:** `POST /api/query`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "question": "What is the main topic?",
  "topK": 5,
  "useOllama": true
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| question | string | required | User's question |
| topK | number | 5 | Number of chunks to retrieve |
| useOllama | boolean | false | Use LLM for answer generation |

**Response:**
```json
{
  "question": "What is the main topic?",
  "language": "en",
  "answer": "The main topic of the document is artificial intelligence and machine learning applications...",
  "relevantChunks": [
    {
      "text": "Artificial intelligence refers to the simulation of human intelligence...",
      "similarity": 0.92,
      "docId": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "text": "Machine learning is a subset of AI that enables systems to learn...",
      "similarity": 0.88,
      "docId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "source": "ollama_rag"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| question | string | The original question |
| language | string | Detected language ('en' or 'hi') |
| answer | string | Generated answer |
| relevantChunks | array | Retrieved document chunks |
| source | string | Answer source ('ollama_rag', 'embedding_only', 'no_match') |

**Chunk Object:**
| Field | Type | Description |
|-------|------|-------------|
| text | string | The chunk text |
| similarity | number | Cosine similarity (0-1) |
| docId | string | Source document ID |

**Answer Sources:**
- `ollama_rag` - Generated by LLM using RAG
- `embedding_only` - Retrieved chunks without LLM
- `no_match` - No similar chunks found

**Status Codes:**
- 200 OK - Query successful
- 400 Bad Request - Missing question parameter
- 500 Internal Server Error - Query processing failed

**Examples:**

English Question:
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main findings?",
    "topK": 5,
    "useOllama": true
  }'
```

Hindi Question:
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "मुख्य विषय क्या है?",
    "topK": 5,
    "useOllama": true
  }'
```

---

## 🏥 System Endpoints

### Health Check
**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-07T10:30:00.000Z",
  "ollama": {
    "available": true,
    "model": "llama2"
  },
  "vectorStore": {
    "documents": 2,
    "chunks": 15
  }
}
```

**Status Codes:**
- 200 OK - System operational
- 500 Internal Server Error - System issues

---

### Get Configuration
**Endpoint:** `GET /api/config`

**Response:**
```json
{
  "apiUrl": "http://localhost:8000",
  "ollamaUrl": "http://localhost:11434",
  "supportedFormats": ["PDF", "DOCX", "TXT", "JPG", "PNG"],
  "maxFileSize": 500,
  "embeddingModel": "nomic-embed-text",
  "ollamaModel": "llama2"
}
```

---

## 🔄 Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Errors

**400 Bad Request**
```json
{
  "error": "No file uploaded"
}
```

**404 Not Found**
```json
{
  "error": "Document not found"
}
```

**413 Payload Too Large**
```json
{
  "error": "File too large: max size is 500MB"
}
```

**415 Unsupported Media Type**
```json
{
  "error": "Unsupported file type: application/xml"
}
```

**500 Internal Server Error**
```json
{
  "error": "Processing failed: PDF extraction error"
}
```

---

## 📊 Rate Limiting

Currently no built-in rate limiting. For production, use Nginx configuration (included in `nginx.conf`):
- API calls: 10 requests/second
- Upload: 5 requests/minute

---

## 🔗 Example Workflows

### Complete Workflow
```bash
# 1. Upload document
curl -X POST http://localhost:8000/api/upload \
  -F "file=@myfile.pdf"

# Save the docId from response

# 2. Wait for processing (check status)
curl http://localhost:8000/api/documents/{docId}

# 3. Ask question
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is discussed?",
    "topK": 5,
    "useOllama": true
  }'

# 4. Delete document
curl -X DELETE http://localhost:8000/api/documents/{docId}
```

### Python Example
```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Upload
files = {'file': open('document.pdf', 'rb')}
response = requests.post(f'{BASE_URL}/api/upload', files=files)
doc_id = response.json()['docId']

# Query
query_data = {
    "question": "What is the main topic?",
    "topK": 5,
    "useOllama": True
}
response = requests.post(f'{BASE_URL}/api/query', json=query_data)
answer = response.json()['answer']
print(answer)

# Delete
requests.delete(f'{BASE_URL}/api/documents/{doc_id}')
```

### JavaScript/Fetch Example
```javascript
const BASE_URL = 'http://localhost:8000';

// Upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
  method: 'POST',
  body: formData
});
const { docId } = await uploadResponse.json();

// Query
const queryResponse = await fetch(`${BASE_URL}/api/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What is the main topic?',
    topK: 5,
    useOllama: true
  })
});
const { answer, relevantChunks } = await queryResponse.json();

// Delete
await fetch(`${BASE_URL}/api/documents/${docId}`, {
  method: 'DELETE'
});
```

---

## 🔧 Configuration via API

System configuration can be retrieved but not modified via API. To change settings, edit `backend/.env`:

```env
OLLAMA_MODEL=mistral        # Change LLM
EMBEDDING_MODEL=all-minilm  # Change embeddings
PORT=8000                   # Change server port
```

---

## 📈 Performance Notes

### Response Times
- Document upload: 1-2 seconds (processing continues async)
- Query (embedding only): 100-200ms
- Query (with Ollama): 5-30 seconds
- Similarity search: <100ms

### Concurrency
- Handles multiple concurrent requests
- Ollama model runs serially (queued)
- Embedding generation is parallelized

---

## 🔒 Security Notes

- No authentication required (local use)
- File uploads validated by MIME type
- Input sanitization for text fields
- Error messages don't leak sensitive info

---

## 📞 Support

For API issues:
1. Check server is running: `curl http://localhost:8000/api/health`
2. Check Ollama is running: `curl http://localhost:11434/api/tags`
3. Review error messages in terminal
4. Check `README.md` Troubleshooting section

---

**API Version:** 1.0.0
**Last Updated:** December 2024
