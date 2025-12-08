import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

import DocumentExtractor from '../modules/documentExtractor.js';
import OCRModule from '../modules/ocr.js';
import TextChunker from '../modules/textChunker.js';
import LanguageDetector from '../utils/languageDetector.js';
import { FileManager, isSupportedType, getFileTypeCategory, SUPPORTED_TYPES } from '../utils/fileManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createUploadRoutes(app, embedding, groq) {
  const fileManager = new FileManager(path.join(__dirname, '../../uploads'));
  
  // Configure multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
      if (isSupportedType(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
    },
  });

  // Store document metadata
  const documents = new Map();

  /**
   * POST /api/upload - Upload and process a file
   */
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileTypeCategory = getFileTypeCategory(req.file.mimetype);
      const docId = uuidv4();

      // Save file to disk
      await fileManager.initialize();
      const fileInfo = await fileManager.saveFile(req.file);

      res.json({
        status: 'processing',
        docId,
        fileId: fileInfo.fileId,
        fileName: fileInfo.originalName,
        fileSize: fileInfo.size,
        fileType: fileTypeCategory,
        message: 'File uploaded. Processing text extraction...',
      });

      // Process in background
      processDocumentAsync(docId, fileInfo, fileTypeCategory);
    } catch (error) {
      console.error('[Upload] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Process document asynchronously
   */
  async function processDocumentAsync(docId, fileInfo, fileType) {
    try {
      let extractedText = '';

      // Extract text based on file type
      if (fileType === 'PDF') {
        console.log(`[Process] Extracting PDF: ${fileInfo.originalName}`);
        extractedText = await DocumentExtractor.extract(fileInfo.filePath);
      } else if (fileType === 'DOCX') {
        console.log(`[Process] Extracting DOCX: ${fileInfo.originalName}`);
        extractedText = await DocumentExtractor.extract(fileInfo.filePath);
      } else if (fileType === 'TXT') {
        console.log(`[Process] Extracting TXT: ${fileInfo.originalName}`);
        extractedText = await DocumentExtractor.extract(fileInfo.filePath);
      } else if (fileType === 'IMAGE') {
        console.log(`[Process] Running OCR on image: ${fileInfo.originalName}`);
        await OCRModule.initialize();
        extractedText = await OCRModule.extractText(fileInfo.filePath, 'auto');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text extracted from document');
      }

      // Detect language
      const langDetection = LanguageDetector.detectWithConfidence(extractedText);

      // Chunk the text
      const chunks = TextChunker.smartChunk(extractedText, 500, 50);
      const stats = TextChunker.getStats(chunks);

      console.log(`[Process] Chunks created: ${chunks.length}, Stats:`, stats);

      // Generate embeddings
      console.log(`[Process] Generating embeddings for ${chunks.length} chunks...`);
      const embeddings = await embedding.generateEmbeddingsBatch(chunks);

      // Filter out null embeddings
      const validChunks = chunks.filter((_, i) => embeddings[i] !== null);
      const validEmbeddings = embeddings.filter(e => e !== null);

      if (validChunks.length === 0) {
        throw new Error('Failed to generate embeddings');
      }

      // Add to vector store
      await embedding.addDocument(docId, validChunks, validEmbeddings, {
        fileName: fileInfo.originalName,
        fileSize: fileInfo.size,
        fileType,
        language: langDetection.language,
        languageConfidence: langDetection.confidence,
      });

      // Store document metadata
      documents.set(docId, {
        docId,
        fileInfo,
        fileType,
        language: langDetection.language,
        languageConfidence: langDetection.confidence,
        extractedTextLength: extractedText.length,
        chunkCount: validChunks.length,
        processedAt: new Date().toISOString(),
        extractedTextPreview: extractedText.substring(0, 500),
      });

      // Save vector store
      await embedding.saveVectorStore(path.join(__dirname, '../../vectors/store.json'));

      console.log(`[Process] Document ${docId} processed successfully`);
    } catch (error) {
      console.error(`[Process] Error processing document ${docId}:`, error.message);
      documents.set(docId, {
        docId,
        error: error.message,
        status: 'failed',
        processedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/documents - List all documents
   */
  app.get('/api/documents', (req, res) => {
    try {
      const docs = Array.from(documents.values());
      const stats = embedding.getStats();
      res.json({
        totalDocuments: docs.length,
        documents: docs,
        vectorStats: stats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/documents/:docId - Get document details
   */
  app.get('/api/documents/:docId', (req, res) => {
    try {
      const doc = documents.get(req.params.docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/documents/:docId - Delete document
   */
  app.delete('/api/documents/:docId', async (req, res) => {
    try {
      const docId = req.params.docId;
      const doc = documents.get(docId);

      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete from vector store
      embedding.deleteDocument(docId);

      // Delete from disk
      await fileManager.deleteFile(doc.fileInfo.fileId);

      // Delete from memory
      documents.delete(docId);

      // Save updated vector store
      await embedding.saveVectorStore(path.join(__dirname, '../../vectors/store.json'));

      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/query - Ask a question about documents
   */
  app.post('/api/query', async (req, res) => {
    try {
      const { question, topK = 5, useOllama = false } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Detect question language
      const questionLang = LanguageDetector.detect(question);

      // Search for relevant chunks
      const searchResults = await embedding.query(question, topK);

      if (searchResults.length === 0) {
        return res.json({
          question,
          language: questionLang,
          answer: questionLang === 'hi' 
            ? 'दुर्भाग्यवश, आपके दस्तावेजों में इस प्रश्न का उत्तर नहीं मिला।'
            : 'No relevant information found in your documents.',
          relevantChunks: [],
          source: 'no_match',
        });
      }

      // Extract context
      const contexts = searchResults.map(r => r.text);

      let answer;
      let source = 'embedding_only';

      // Use Groq AI for better responses
      if (useOllama) {
        try {
          const isAvailable = await groq.isAvailable();
          if (!isAvailable) {
            console.warn('[Query] Groq not available, using fallback');
          } else {
            // Build RAG prompt with context
            const contextStr = contexts.slice(0, 3).join('\n\n');
            const ragPrompt = questionLang === 'hi' 
              ? `निम्नलिखित संदर्भ के आधार पर प्रश्न का उत्तर दें:\n\nसंदर्भ:\n${contextStr}\n\nप्रश्न: ${question}\n\nउत्तर:`
              : `Based on the following context, answer the question:\n\nContext:\n${contextStr}\n\nQuestion: ${question}\n\nAnswer:`;
            
            answer = await groq.generate(ragPrompt, 1024);
            source = 'groq_rag';
          }
        } catch (error) {
          console.warn('[Query] Groq generation failed, using fallback:', error.message);
        }
      }

      // Fallback: Return context if no Groq answer
      if (!answer) {
        answer = questionLang === 'hi'
          ? `निम्नलिखित संदर्भ प्रासंगिक हो सकता है:\n\n${contexts.slice(0, 2).join('\n\n')}`
          : `Based on the document:\n\n${contexts.slice(0, 2).join('\n\n')}`;
      }

      res.json({
        question,
        language: questionLang,
        answer,
        relevantChunks: searchResults.map(r => ({
          text: r.text,
          similarity: r.similarity,
          docId: r.docId,
        })),
        source,
      });
    } catch (error) {
      console.error('[Query] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/ask - Lovable compatibility endpoint for AI chat
   * Converts Lovable format to internal query format
   */
  app.post('/api/ask', async (req, res) => {
    try {
      const { message, messages = [], model = 'groq' } = req.body;

      // Extract the question from either 'message' or 'messages' array
      const question = message || (messages.length > 0 ? messages[messages.length - 1].content : '');

      if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Detect question language
      const questionLang = LanguageDetector.detect(question);

      // Search for relevant chunks from documents
      const searchResults = await embedding.query(question, 5);

      let answer;
      let source = 'embedding_only';

      // Try to use Groq for better responses
      try {
        if (groq && searchResults.length > 0) {
          // Build RAG prompt with context
          const contexts = searchResults.map(r => r.text);
          const contextStr = contexts.slice(0, 3).join('\n\n');
          
          const ragPrompt = questionLang === 'hi' 
            ? `निम्नलिखित संदर्भ के आधार पर प्रश्न का उत्तर दें:\n\nसंदर्भ:\n${contextStr}\n\nप्रश्न: ${question}\n\nउत्तर:`
            : `Based on the following context, answer the question:\n\nContext:\n${contextStr}\n\nQuestion: ${question}\n\nAnswer:`;
          
          answer = await groq.generate(ragPrompt, 1024);
          source = 'groq_rag';
        } else if (groq) {
          // No documents uploaded, just use Groq directly
          answer = await groq.generate(question, 1024);
          source = 'groq_direct';
        }
      } catch (error) {
        console.warn('[Ask] Groq generation failed:', error.message);
        // Fall back to context-based answer
        if (searchResults.length > 0) {
          const contexts = searchResults.map(r => r.text);
          answer = questionLang === 'hi'
            ? `निम्नलिखित संदर्भ प्रासंगिक हो सकता है:\n\n${contexts.slice(0, 2).join('\n\n')}`
            : `Based on the document:\n\n${contexts.slice(0, 2).join('\n\n')}`;
        } else {
          answer = questionLang === 'hi'
            ? 'कृपया पहले एक दस्तावेज़ अपलोड करें।'
            : 'Please upload a document first.';
        }
      }

      // Return in Lovable-compatible format
      res.json({
        content: answer,
        message: answer,
        answer: answer,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        source: source,
        relevantChunks: searchResults.map(r => ({
          text: r.text,
          similarity: r.similarity,
          docId: r.docId,
        })),
      });
    } catch (error) {
      console.error('[Ask] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/models - Lovable compatibility endpoint for model list
   */
  app.get('/api/models', (req, res) => {
    try {
      res.json({
        models: [
          {
            id: 'groq-llama-3.3-70b',
            name: 'Groq Llama 3.3 70B (Ultra-Fast)',
            provider: 'groq',
            type: 'text-generation',
            speed: 'ultra-fast',
            context: 8192,
          },
          {
            id: 'trilokgpt-rag',
            name: 'TrilokGPT RAG (Document Q&A)',
            provider: 'groq',
            type: 'document-qa',
            speed: 'ultra-fast',
            context: 8192,
          },
        ],
        default: 'groq-llama-3.3-70b',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/health - Health check
   */
  app.get('/api/health', async (req, res) => {
    try {
      const stats = embedding.getStats();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        groq: {
          available: groq ? true : false,
          model: groq ? 'llama-3.3-70b-versatile' : 'none',
        },
        vectorStore: {
          documents: stats.totalDocuments,
          chunks: stats.totalChunks,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  return { documents };
}
