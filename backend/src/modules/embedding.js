import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Embedding Module with FAISS Vector Database
 * Uses Ollama Embeddings API (free, local)
 */

export class EmbeddingModule {
  constructor(ollamaUrl = 'http://localhost:11434', model = 'nomic-embed-text') {
    this.ollamaUrl = ollamaUrl;
    this.model = model;
    this.vectorStore = new Map(); // In-memory vector store
    this.documentIndex = new Map(); // Document metadata
  }

  /**
   * Generate embedding for a single text using Ollama
   * @param {string} text - Input text
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embed`,
        {
          model: this.model,
          input: text,
        },
        { timeout: 30000 }
      );

      if (response.data.embeddings && response.data.embeddings.length > 0) {
        return response.data.embeddings[0];
      }

      throw new Error('No embeddings returned from Ollama');
    } catch (error) {
      console.error('[Embedding] Error generating embedding:', error.message);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple chunks (batch)
   * @param {string[]} chunks - Array of text chunks
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async generateEmbeddingsBatch(chunks) {
    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk);
        embeddings.push(embedding);
      } catch (error) {
        console.error('[Embedding] Batch processing error:', error.message);
        embeddings.push(null); // Add null for failed chunks
      }
    }
    return embeddings;
  }

  /**
   * Add document chunks to vector store
   * @param {string} docId - Document ID
   * @param {string[]} chunks - Text chunks
   * @param {number[][]} embeddings - Embedding vectors
   * @param {Object} metadata - Document metadata
   */
  async addDocument(docId, chunks, embeddings, metadata = {}) {
    try {
      if (chunks.length !== embeddings.length) {
        throw new Error('Chunks and embeddings length mismatch');
      }

      // Store document metadata
      this.documentIndex.set(docId, {
        ...metadata,
        chunkCount: chunks.length,
        createdAt: new Date().toISOString(),
      });

      // Store chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${docId}:${i}`;
        this.vectorStore.set(chunkId, {
          docId,
          chunkIndex: i,
          text: chunks[i],
          embedding: embeddings[i],
        });
      }

      console.log(`[Embedding] Added document ${docId} with ${chunks.length} chunks`);
      return { success: true, chunkCount: chunks.length };
    } catch (error) {
      console.error('[Embedding] Error adding document:', error.message);
      throw error;
    }
  }

  /**
   * Similarity search using cosine similarity
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {number} topK - Number of top results to return
   * @returns {Array} Array of matching chunks with scores
   */
  similaritySearch(queryEmbedding, topK = 5) {
    const results = [];

    for (const [chunkId, data] of this.vectorStore.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
      results.push({
        chunkId,
        docId: data.docId,
        text: data.text,
        similarity,
      });
    }

    // Sort by similarity descending and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Query for relevant chunks based on question
   * @param {string} question - User question
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array>} Relevant chunks
   */
  async query(question, topK = 5) {
    try {
      const queryEmbedding = await this.generateEmbedding(question);
      const results = this.similaritySearch(queryEmbedding, topK);
      return results;
    } catch (error) {
      console.error('[Embedding] Query error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vec1 - First vector
   * @param {number[]} vec2 - Second vector
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Save vector store to disk (FAISS-like persistence)
   * @param {string} filePath - File path to save
   */
  async saveVectorStore(filePath) {
    try {
      const data = {
        vectorStore: Array.from(this.vectorStore.entries()),
        documentIndex: Array.from(this.documentIndex.entries()),
        model: this.model,
        savedAt: new Date().toISOString(),
      };

      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`[Embedding] Vector store saved to ${filePath}`);
    } catch (error) {
      console.error('[Embedding] Error saving vector store:', error.message);
      throw error;
    }
  }

  /**
   * Load vector store from disk
   * @param {string} filePath - File path to load
   */
  async loadVectorStore(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.vectorStore = new Map(data.vectorStore);
      this.documentIndex = new Map(data.documentIndex);
      this.model = data.model;

      console.log(`[Embedding] Vector store loaded from ${filePath}`);
    } catch (error) {
      console.error('[Embedding] Error loading vector store:', error.message);
      // Return silently - vector store might not exist yet
    }
  }

  /**
   * Delete a document and its embeddings
   * @param {string} docId - Document ID
   */
  deleteDocument(docId) {
    let deleted = 0;
    for (const [chunkId] of this.vectorStore.entries()) {
      if (chunkId.startsWith(`${docId}:`)) {
        this.vectorStore.delete(chunkId);
        deleted++;
      }
    }
    this.documentIndex.delete(docId);
    console.log(`[Embedding] Deleted document ${docId} (${deleted} chunks removed)`);
    return deleted;
  }

  /**
   * Get document statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalDocuments: this.documentIndex.size,
      totalChunks: this.vectorStore.size,
      documents: Array.from(this.documentIndex.entries()).map(([docId, meta]) => ({
        docId,
        ...meta,
      })),
    };
  }
}

export default EmbeddingModule;
