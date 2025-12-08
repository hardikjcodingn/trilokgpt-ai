/**
 * OCR Fallback Module - Alternative OCR methods when Tesseract fails
 * Provides multiple strategies for text extraction from images
 */

export class OCRFallback {
  /**
   * Use Google Cloud Vision API as fallback (requires API key)
   * For now, returns a descriptive placeholder
   */
  static async extractWithGoogle(imagePath, googleApiKey) {
    try {
      if (!googleApiKey) {
        return null; // No API key, skip this fallback
      }

      // This would require installing @google-cloud/vision
      // For now, just log that it would be attempted
      console.log('[OCR-Fallback] Google Vision API would be used here (not configured)');
      return null;
    } catch (error) {
      console.warn('[OCR-Fallback] Google Vision fallback failed:', error.message);
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

    // Try filename extraction
    const filenameResult = this.extractFromFilename(imagePath);
    if (filenameResult) {
      console.log('[OCR-Fallback] Extracted text from filename');
      return filenameResult.text;
    }

    // Try Google Vision if API key provided
    if (options.googleApiKey) {
      const googleResult = await this.extractWithGoogle(imagePath, options.googleApiKey);
      if (googleResult) {
        console.log('[OCR-Fallback] Google Vision extraction succeeded');
        return googleResult;
      }
    }

    // Last resort: return metadata placeholder
    console.log('[OCR-Fallback] All fallbacks exhausted, returning placeholder text');
    const emptyResult = this.createEmptyResult(imagePath);
    return emptyResult.text;
  }
}

export default OCRFallback;
