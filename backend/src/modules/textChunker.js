/**
 * Text Chunking Module
 * Splits documents into overlapping chunks for embedding
 */

export class TextChunker {
  /**
   * Split text into chunks
   * @param {string} text - Input text
   * @param {number} chunkSize - Max tokens per chunk (approximately 4 chars = 1 token)
   * @param {number} overlap - Overlap between chunks (tokens)
   * @returns {string[]} Array of text chunks
   */
  static chunkByTokens(text, chunkSize = 500, overlap = 50) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Clean and normalize text
    let cleanText = text.trim().replace(/\s+/g, ' ');

    // Approximate character count (4 chars ≈ 1 token)
    const charSize = chunkSize * 4;
    const charOverlap = overlap * 4;

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
      let end = Math.min(start + charSize, cleanText.length);

      // Try to break at sentence boundary (. ! ?)
      if (end < cleanText.length) {
        const lastPeriod = cleanText.lastIndexOf('.', end);
        const lastExclamation = cleanText.lastIndexOf('!', end);
        const lastQuestion = cleanText.lastIndexOf('?', end);
        const lastNewline = cleanText.lastIndexOf('\n', end);

        const candidates = [lastPeriod, lastExclamation, lastQuestion, lastNewline].filter(i => i > start + charSize * 0.7);
        if (candidates.length > 0) {
          end = Math.max(...candidates) + 1;
        }
      }

      chunks.push(cleanText.substring(start, end).trim());
      start = end - charOverlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Split text by sentences
   * @param {string} text - Input text
   * @param {number} sentencesPerChunk - Number of sentences per chunk
   * @param {number} overlapSentences - Overlapping sentences
   * @returns {string[]} Array of text chunks
   */
  static chunkBySentences(text, sentencesPerChunk = 5, overlapSentences = 1) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split by sentence boundaries
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
    
    if (sentences.length === 0) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < sentences.length) {
      const end = Math.min(start + sentencesPerChunk, sentences.length);
      chunks.push(sentences.slice(start, end).join(' ').trim());
      start = end - overlapSentences;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Split text by paragraphs
   * @param {string} text - Input text
   * @returns {string[]} Array of paragraphs
   */
  static chunkByParagraphs(text) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    return text
      .split(/\n\n+/)
      .map(para => para.trim())
      .filter(para => para.length > 0);
  }

  /**
   * Smart chunking: Use sentences within token limit
   * @param {string} text - Input text
   * @param {number} maxTokens - Maximum tokens per chunk
   * @param {number} overlapTokens - Overlapping tokens
   * @returns {string[]} Array of text chunks
   */
  static smartChunk(text, maxTokens = 500, overlapTokens = 50) {
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = Math.ceil(sentence.length / 4);

      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        // Start new chunk with overlap
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentChunk += ' ' + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Get chunk statistics
   * @param {string[]} chunks - Array of chunks
   * @returns {Object} Statistics object
   */
  static getStats(chunks) {
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const totalTokens = Math.ceil(totalChars / 4);
    const avgChunkSize = chunks.length > 0 ? totalChars / chunks.length : 0;
    const avgChunkTokens = Math.ceil(avgChunkSize / 4);

    return {
      totalChunks: chunks.length,
      totalCharacters: totalChars,
      totalTokens,
      averageChunkSize: avgChunkSize,
      averageChunkTokens: avgChunkTokens,
      minChunkSize: chunks.length > 0 ? Math.min(...chunks.map(c => c.length)) : 0,
      maxChunkSize: chunks.length > 0 ? Math.max(...chunks.map(c => c.length)) : 0,
    };
  }
}

export default TextChunker;
