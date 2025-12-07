import axios from 'axios';

/**
 * Ollama Module - Integration with Ollama for Llama3/Mistral/Gemma
 * Provides local LLM inference without paid APIs
 */

export class OllamaModule {
  constructor(ollamaUrl = 'http://localhost:11434', model = 'llama2') {
    this.ollamaUrl = ollamaUrl;
    this.model = model;
  }

  /**
   * Check if Ollama service is running and model is available
   * @returns {Promise<boolean>} Is Ollama ready
   */
  async isReady() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('[Ollama] Service check failed:', error.message);
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Promise<string[]>} List of model names
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return response.data.models.map(m => m.name);
    } catch (error) {
      console.error('[Ollama] Failed to list models:', error.message);
      return [];
    }
  }

  /**
   * Generate response using Ollama
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated response
   */
  async generate(prompt, options = {}) {
    try {
      const payload = {
        model: this.model,
        prompt,
        stream: false,
        ...options,
      };

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        payload,
        { timeout: 120000 } // 2 minute timeout for generation
      );

      return response.data.response;
    } catch (error) {
      console.error('[Ollama] Generation error:', error.message);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Generate response with streaming (for real-time output)
   * @param {string} prompt - Input prompt
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Generation options
   */
  async generateStream(prompt, onChunk, options = {}) {
    try {
      const payload = {
        model: this.model,
        prompt,
        stream: true,
        ...options,
      };

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        payload,
        {
          timeout: 120000,
          responseType: 'stream',
        }
      );

      return new Promise((resolve, reject) => {
        let fullResponse = '';

        response.data.on('data', chunk => {
          const lines = chunk.toString().split('\n').filter(line => line);
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                fullResponse += json.response;
                onChunk(json.response);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        });

        response.data.on('end', () => resolve(fullResponse));
        response.data.on('error', reject);
      });
    } catch (error) {
      console.error('[Ollama] Stream generation error:', error.message);
      throw error;
    }
  }

  /**
   * Create a prompt for RAG (Retrieval-Augmented Generation)
   * @param {string} question - User question
   * @param {string[]} contexts - Retrieved context chunks
   * @param {string} language - Response language ('en', 'hi')
   * @returns {string} Formatted prompt
   */
  createRAGPrompt(question, contexts, language = 'en') {
    const contextText = contexts.join('\n\n---\n\n');

    if (language === 'hi') {
      return `निम्नलिखित संदर्भ के आधार पर सवाल का उत्तर दें:

संदर्भ:
${contextText}

सवाल: ${question}

उत्तर:`;
    }

    return `Based on the following context, answer the question:

Context:
${contextText}

Question: ${question}

Answer:`;
  }

  /**
   * Generate answer for a question using RAG
   * @param {string} question - User question
   * @param {string[]} contexts - Retrieved context chunks
   * @param {string} language - Response language
   * @returns {Promise<string>} Answer
   */
  async generateRAGAnswer(question, contexts, language = 'en') {
    try {
      if (contexts.length === 0) {
        const noContextMsg =
          language === 'hi'
            ? 'दुर्भाग्यवश, दिए गए दस्तावेजों में इसका कोई उत्तर नहीं मिला।'
            : "I couldn't find information to answer your question in the provided documents.";
        return noContextMsg;
      }

      const prompt = this.createRAGPrompt(question, contexts, language);
      const answer = await this.generate(prompt, {
        temperature: 0.5,
        top_p: 0.9,
        num_predict: 256,
      });

      return answer.trim();
    } catch (error) {
      console.error('[Ollama] RAG answer generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Input text
   * @returns {Promise<string>} Language code ('en', 'hi', etc.)
   */
  async detectLanguage(text) {
    try {
      const prompt = `Identify the language of this text in one word (e.g., "English", "Hindi", "Spanish"):

Text: "${text.substring(0, 200)}"

Language:`;

      const response = await this.generate(prompt, { num_predict: 10 });
      const lang = response.toLowerCase().trim();

      if (lang.includes('hindi') || lang === 'hi') return 'hi';
      if (lang.includes('english') || lang === 'en') return 'en';
      return 'en'; // Default to English
    } catch (error) {
      console.error('[Ollama] Language detection failed:', error.message);
      return 'en'; // Default to English on error
    }
  }

  /**
   * Summarize text
   * @param {string} text - Text to summarize
   * @param {number} maxLength - Max length of summary in words
   * @returns {Promise<string>} Summarized text
   */
  async summarize(text, maxLength = 100) {
    try {
      const prompt = `Summarize the following text in approximately ${maxLength} words:

${text}

Summary:`;

      return await this.generate(prompt, { num_predict: maxLength + 20 });
    } catch (error) {
      console.error('[Ollama] Summarization failed:', error.message);
      throw error;
    }
  }

  /**
   * Set the model to use
   * @param {string} modelName - Model name (e.g., 'llama2', 'mistral', 'gemma')
   */
  setModel(modelName) {
    this.model = modelName;
    console.log(`[Ollama] Model set to: ${modelName}`);
  }
}

export default OllamaModule;
