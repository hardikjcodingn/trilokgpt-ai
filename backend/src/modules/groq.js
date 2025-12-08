import Groq from 'groq-sdk';

/**
 * Groq LLM Module - Ultra-fast AI inference using Groq API
 * Replaces local Ollama with cloud-based Groq for better performance
 */
export default class GroqModule {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    this.groq = new Groq({ apiKey });
    this.model = 'mixtral-8x7b-32768'; // Fast and capable model
  }

  /**
   * Generate a response using Groq API
   * @param {string} prompt - The prompt to send to the model
   * @param {number} maxTokens - Maximum tokens in response (default: 1024)
   * @returns {Promise<string>} - The generated response
   */
  async generate(prompt, maxTokens = 1024) {
    try {
      const message = await this.groq.messages.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        max_tokens: maxTokens,
        temperature: 0.7
      });

      if (message.content && message.content.length > 0) {
        return message.content[0].text;
      }
      
      return 'No response generated';
    } catch (error) {
      console.error('Groq API Error:', error.message);
      throw new Error(`Groq inference failed: ${error.message}`);
    }
  }

  /**
   * Generate a response with chat history
   * @param {Array} messages - Array of message objects with role and content
   * @param {number} maxTokens - Maximum tokens in response
   * @returns {Promise<string>} - The generated response
   */
  async chat(messages, maxTokens = 1024) {
    try {
      const response = await this.groq.messages.create({
        messages,
        model: this.model,
        max_tokens: maxTokens,
        temperature: 0.7
      });

      if (response.content && response.content.length > 0) {
        return response.content[0].text;
      }
      
      return 'No response generated';
    } catch (error) {
      console.error('Groq Chat Error:', error.message);
      throw new Error(`Groq chat failed: ${error.message}`);
    }
  }

  /**
   * Check if Groq API is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const message = await this.groq.messages.create({
        messages: [{ role: 'user', content: 'test' }],
        model: this.model,
        max_tokens: 10
      });
      return !!message;
    } catch (error) {
      console.error('Groq availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get model information
   * @returns {object}
   */
  getInfo() {
    return {
      provider: 'Groq',
      model: this.model,
      type: 'cloud-based',
      speed: 'ultra-fast',
      capabilities: ['chat', 'code-generation', 'summarization', 'qa']
    };
  }
}
