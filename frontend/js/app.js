/**
 * TrilokGPT Frontend Application
 * Main client-side logic for document upload and Q&A
 */

class TrilokGPT {
  constructor() {
    this.apiUrl = 'http://localhost:8000';
    this.documents = new Map();
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    this.setupEventListeners();
    await this.loadConfig();
    await this.updateStats();
    await this.checkOllamaStatus();
  }

  /**
   * Load configuration from server
   */
  async loadConfig() {
    try {
      const response = await fetch(`${this.apiUrl}/api/config`);
      const config = await response.json();
      console.log('[Config]', config);
      this.config = config;
    } catch (error) {
      console.error('[Config] Error:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      this.handleFileSelect(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', e => {
      this.handleFileSelect(e.target.files);
    });

    // Chat
    document.getElementById('sendBtn').addEventListener('click', () => this.askQuestion());
    document.getElementById('questionInput').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.askQuestion();
      }
    });

    // Details panel
    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
      document.getElementById('detailsPanel').style.display = 'none';
    });

    // Auto-load documents on startup
    this.loadDocuments();
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(files) {
    for (const file of files) {
      await this.uploadFile(file);
    }
  }

  /**
   * Upload a file to the server
   */
  async uploadFile(file) {
    try {
      // Validate file
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert(`File too large: ${file.name} (Max: 500MB)`);
        return;
      }

      // Show progress
      document.getElementById('uploadProgress').style.display = 'block';
      document.getElementById('progressText').textContent = `Uploading: ${file.name}`;

      // Upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      this.addMessage('assistant', `✅ ${result.fileName} uploaded and being processed...`, {
        source: 'system',
      });

      // Poll for processing completion
      await this.pollDocumentProcessing(result.docId, file.name);

      document.getElementById('uploadProgress').style.display = 'none';
    } catch (error) {
      console.error('[Upload] Error:', error);
      this.addMessage('assistant', `❌ Upload failed: ${error.message}`, { source: 'error' });
      document.getElementById('uploadProgress').style.display = 'none';
    }
  }

  /**
   * Poll for document processing completion
   */
  async pollDocumentProcessing(docId, fileName) {
    let processed = false;
    let attempts = 0;

    while (!processed && attempts < 300) {
      // Poll for up to 5 minutes
      try {
        const response = await fetch(`${this.apiUrl}/api/documents/${docId}`);
        const doc = await response.json();

        if (doc.error) {
          this.addMessage('assistant', `❌ Error processing ${fileName}: ${doc.error}`, {
            source: 'error',
          });
          processed = true;
        } else if (doc.chunkCount) {
          this.addMessage('assistant', `✅ Successfully processed "${fileName}":\n- Chunks: ${doc.chunkCount}\n- Language: ${doc.language === 'hi' ? 'Hindi' : 'English'}\n- Size: ${Math.round(doc.extractedTextLength / 1024)}KB`, {
            source: 'success',
          });
          processed = true;
        }
      } catch (error) {
        console.error('[Poll] Error:', error);
      }

      if (!processed) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
      }
    }

    await this.loadDocuments();
    await this.updateStats();
  }

  /**
   * Load documents list
   */
  async loadDocuments() {
    try {
      const response = await fetch(`${this.apiUrl}/api/documents`);
      const data = await response.json();

      const listContainer = document.getElementById('documentsList');
      listContainer.innerHTML = '';

      if (data.documents.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No documents uploaded yet</p>';
        return;
      }

      for (const doc of data.documents) {
        if (doc.error) continue; // Skip failed documents

        const docEl = document.createElement('div');
        docEl.className = 'document-item';
        docEl.innerHTML = `
          <div class="document-name">${doc.fileInfo.originalName}</div>
          <div class="document-badge">${doc.fileType}</div>
          <div class="document-actions">
            <button class="btn-delete" data-doc-id="${doc.docId}">Delete</button>
          </div>
        `;

        docEl.addEventListener('click', () => this.showDocumentDetails(doc));
        docEl.querySelector('.btn-delete').addEventListener('click', e => {
          e.stopPropagation();
          this.deleteDocument(doc.docId);
        });

        listContainer.appendChild(docEl);
        this.documents.set(doc.docId, doc);
      }
    } catch (error) {
      console.error('[LoadDocuments] Error:', error);
    }
  }

  /**
   * Show document details in side panel
   */
  showDocumentDetails(doc) {
    const panel = document.getElementById('detailsPanel');
    const content = document.getElementById('detailsContent');

    content.innerHTML = `
      <div class="detail-section">
        <h4>📄 File Name</h4>
        <p class="detail-text">${doc.fileInfo.originalName}</p>
      </div>
      <div class="detail-section">
        <h4>📊 File Type</h4>
        <p class="detail-text">${doc.fileType}</p>
      </div>
      <div class="detail-section">
        <h4>📦 Size</h4>
        <p class="detail-text">${(doc.fileInfo.size / 1024).toFixed(2)} KB</p>
      </div>
      <div class="detail-section">
        <h4>🌐 Language</h4>
        <p class="detail-text">${doc.language === 'hi' ? 'Hindi' : 'English'} (${(doc.languageConfidence * 100).toFixed(0)}% confidence)</p>
      </div>
      <div class="detail-section">
        <h4>✂️ Chunks</h4>
        <p class="detail-text">${doc.chunkCount}</p>
      </div>
      <div class="detail-section">
        <h4>📝 Text Preview</h4>
        <p class="detail-text">${doc.extractedTextPreview}</p>
      </div>
      <div class="detail-section">
        <h4>⏰ Processed</h4>
        <p class="detail-text">${new Date(doc.processedAt).toLocaleString()}</p>
      </div>
    `;

    panel.style.display = 'block';
  }

  /**
   * Delete a document
   */
  async deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      this.documents.delete(docId);
      await this.loadDocuments();
      await this.updateStats();
      this.addMessage('assistant', '✅ Document deleted successfully');
    } catch (error) {
      console.error('[Delete] Error:', error);
      this.addMessage('assistant', `❌ Delete failed: ${error.message}`, { source: 'error' });
    }
  }

  /**
   * Ask a question
   */
  async askQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();

    if (!question) {
      return;
    }

    if (this.documents.size === 0) {
      this.addMessage('assistant', '❌ Please upload at least one document first!', {
        source: 'error',
      });
      return;
    }

    // Add user message
    this.addMessage('user', question);
    input.value = '';

    // Disable button
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
      const useOllama = document.getElementById('useOllama').checked;

      // Query
      const response = await fetch(`${this.apiUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, topK: 5, useOllama }),
      });

      if (!response.ok) {
        throw new Error('Query failed');
      }

      const result = await response.json();

      // Display answer
      let answerText = result.answer;
      if (result.relevantChunks.length > 0) {
        answerText += '\n\n📚 Sources:\n';
        result.relevantChunks.forEach((chunk, i) => {
          const score = (chunk.similarity * 100).toFixed(0);
          answerText += `\n[${i + 1}] (${score}% relevant) ${chunk.text.substring(0, 150)}...`;
        });
      }

      this.addMessage('assistant', answerText, {
        source: result.source,
        language: result.language,
      });
    } catch (error) {
      console.error('[Query] Error:', error);
      this.addMessage('assistant', `❌ Query failed: ${error.message}`, { source: 'error' });
    } finally {
      sendBtn.disabled = false;
      document.getElementById('questionInput').focus();
    }
  }

  /**
   * Add message to chat
   */
  addMessage(role, text, metadata = {}) {
    const messagesContainer = document.getElementById('chatMessages');

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role} ${metadata.source || ''}`;

    let html = text.replace(/\n/g, '<br>');

    // Add metadata
    let metadataHtml = '';
    if (metadata.source) {
      metadataHtml = `<div class="message-metadata">📌 Source: ${metadata.source}</div>`;
    }
    if (metadata.language) {
      const langName = metadata.language === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English';
      metadataHtml += `<div class="message-metadata">${langName}</div>`;
    }

    messageEl.innerHTML = `${html}${metadataHtml}`;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Update statistics
   */
  async updateStats() {
    try {
      const response = await fetch(`${this.apiUrl}/api/documents`);
      const data = await response.json();

      document.getElementById('statsDocuments').textContent = data.totalDocuments;
      document.getElementById('statsChunks').textContent = data.vectorStats.totalChunks;
    } catch (error) {
      console.error('[UpdateStats] Error:', error);
    }
  }

  /**
   * Check Ollama status
   */
  async checkOllamaStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`);
      const health = await response.json();

      const indicator = document.getElementById('statusIndicator');
      if (health.ollama.available) {
        indicator.className = 'status-online';
        indicator.title = `Ollama ready (${health.ollama.model})`;
      } else {
        indicator.className = 'status-offline';
        indicator.title = 'Ollama not available (install with: ollama pull llama2)';
      }
    } catch (error) {
      console.error('[Health] Error:', error);
      document.getElementById('statusIndicator').className = 'status-offline';
    }

    // Check again every 30 seconds
    setTimeout(() => this.checkOllamaStatus(), 30000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TrilokGPT();
});
