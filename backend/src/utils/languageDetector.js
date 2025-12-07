/**
 * Language Detection Utility
 * Detects language based on text patterns
 */

export class LanguageDetector {
  /**
   * Detect language using character patterns
   * @param {string} text - Input text
   * @returns {string} Language code ('en', 'hi', or 'mixed')
   */
  static detect(text) {
    if (!text || text.trim().length === 0) {
      return 'en';
    }

    // Devanagari script range for Hindi
    const devanagariRange = /[\u0900-\u097F]/g;
    const latinRange = /[a-zA-Z]/g;

    const devanagariChars = (text.match(devanagariRange) || []).length;
    const latinChars = (text.match(latinRange) || []).length;
    const totalChars = text.length;

    // Calculate percentages
    const devanagariPercent = (devanagariChars / totalChars) * 100;
    const latinPercent = (latinChars / totalChars) * 100;

    // Hindi-specific common words
    const hindiWords = /\b(है|का|को|में|और|या|नहीं|हाँ|क्या|यह|वह|मैं|तुम|वे|ये|उन्होंने|किया|करना|होगा|होना)\b/gi;
    const hindiWordCount = (text.match(hindiWords) || []).length;

    // Determine language
    if (devanagariPercent > 20) {
      return 'hi'; // Hindi dominant
    } else if (latinPercent > 80) {
      return 'en'; // English dominant
    } else if (hindiWordCount > 3) {
      return 'hi'; // Has Hindi words
    } else {
      return 'en'; // Default to English
    }
  }

  /**
   * Detect language with confidence score
   * @param {string} text - Input text
   * @returns {Object} Detection result with confidence
   */
  static detectWithConfidence(text) {
    if (!text || text.trim().length === 0) {
      return { language: 'en', confidence: 0.5 };
    }

    const devanagariRange = /[\u0900-\u097F]/g;
    const latinRange = /[a-zA-Z]/g;

    const devanagariChars = (text.match(devanagariRange) || []).length;
    const latinChars = (text.match(latinRange) || []).length;
    const totalChars = text.length;

    const devanagariPercent = (devanagariChars / totalChars) * 100;
    const latinPercent = (latinChars / totalChars) * 100;

    const hindiWords = /\b(है|का|को|में|और|या|नहीं|हाँ|क्या|यह|वह|मैं|तुम|वे|ये|उन्होंने|किया|करना|होगा|होना)\b/gi;
    const hindiWordCount = (text.match(hindiWords) || []).length;

    let language = 'en';
    let confidence = 0.5;

    if (devanagariPercent > 20) {
      language = 'hi';
      confidence = Math.min(1, devanagariPercent / 100 + hindiWordCount * 0.1);
    } else if (latinPercent > 80) {
      language = 'en';
      confidence = latinPercent / 100;
    } else if (hindiWordCount > 3) {
      language = 'hi';
      confidence = 0.7 + hindiWordCount * 0.05;
    }

    return { language, confidence: Math.min(1, confidence) };
  }

  /**
   * Convert language code to display name
   * @param {string} langCode - Language code
   * @returns {string} Language name
   */
  static getLanguageName(langCode) {
    const languages = {
      en: 'English',
      hi: 'Hindi',
      mixed: 'Mixed (English & Hindi)',
    };
    return languages[langCode] || 'Unknown';
  }
}

export default LanguageDetector;
