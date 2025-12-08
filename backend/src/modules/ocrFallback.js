/**
 * OCR Fallback Module - Alternative OCR methods when Tesseract fails
 * Provides multiple strategies for text extraction from images
 */

import axios from 'axios';
import fs from 'fs';

export class OCRFallback {
  /**
   * Use Free OCR API (ocr.space) - No API key required for limited usage
   */
  static async extractWithFreeOCRAPI(imagePath) {
    try {
      console.log('[OCR-Fallback] Attempting Free OCR API (ocr.space)...');
      
      // Read image file
      if (!fs.existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
      }

      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');
      const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Call Free OCR API
      const response = await axios.post('https://api.ocr.space/parse', {
        apikey: 'K87899142372222', // Free tier key (limited usage)
        base64Image: `data:${mimeType};base64,${base64Image}`,
        language: 'eng'
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.ParsedText) {
        const extractedText = response.data.ParsedText.trim();
        if (extractedText.length > 0) {
          console.log('[OCR-Fallback] Free OCR API succeeded');
          return extractedText;
        }
      }

      console.log('[OCR-Fallback] Free OCR API returned empty result');
      return null;
    } catch (error) {
      console.warn('[OCR-Fallback] Free OCR API failed:', error.message);
      return null;
    }
  }

  /**
   * Fallback: Return empty but valid result instead of failing completely
   * Allows documents to be indexed even if OCR fails
   */
  static createEmptyResult(imagePath) {
    return {
      text: '[Image - OCR processing skipped or failed. Image file stored for future analysis.]',
      confidence: 0,
      source: 'fallback',
      originalPath: imagePath,
    };
  }

  /**
   * Fallback: Extract metadata from filename if available
   */
  static extractFromFilename(imagePath) {
    const fileName = imagePath.split(/[\\/]/).pop() || 'image';
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Convert filename to readable text (replace hyphens, underscores with spaces)
    const readableText = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // camelCase to spaced text
    
    if (readableText && readableText.length > 1) {
      return {
        text: `[From filename: ${readableText}]`,
        confidence: 10,
        source: 'filename-extraction',
      };
    }
    
    return null;
  }

  /**
   * Composite fallback strategy
   */
  static async extractWithFallbacks(imagePath, options = {}) {
    console.log('[OCR-Fallback] Attempting fallback extraction strategies...');

    // Try Free OCR API first (most likely to work)
    try {
      const apiResult = await this.extractWithFreeOCRAPI(imagePath);
      if (apiResult) {
        return apiResult;
      }
    } catch (e) {
      console.warn('[OCR-Fallback] Free OCR API error:', e.message);
    }

    // Try filename extraction
    const filenameResult = this.extractFromFilename(imagePath);
    if (filenameResult) {
      console.log('[OCR-Fallback] Extracted text from filename');
      return filenameResult.text;
    }

    // Last resort: return metadata placeholder
    console.log('[OCR-Fallback] All fallbacks exhausted, returning placeholder text');
    const emptyResult = this.createEmptyResult(imagePath);
    return emptyResult.text;
  }
}

export default OCRFallback;
