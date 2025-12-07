import Tesseract from 'tesseract.js';
import Jimp from 'jimp';
import fs from 'fs';

/**
 * OCR Module - Extract text from images using Tesseract.js (free)
 * Supports: JPG, PNG, BMP, TIFF
 */

export class OCRModule {
  constructor() {
    this.worker = null;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    try {
      const { createWorker } = Tesseract;
      this.worker = await createWorker();
      console.log('[OCR] Tesseract worker initialized');
    } catch (error) {
      console.error('[OCR] Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract text from a single image
   * @param {string} imagePath - Path to image file
   * @param {string} language - Language code ('eng', 'hin', 'auto')
   * @returns {Promise<string>} Extracted text
   */
  async extractText(imagePath, language = 'eng') {
    try {
      if (!this.worker) await this.initialize();

      // Determine language for Tesseract
      let lang = language;
      if (language === 'auto') {
        lang = 'eng+hin'; // Try both English and Hindi
      } else if (language === 'hin') {
        lang = 'hin';
      } else {
        lang = 'eng';
      }

      const { data } = await this.worker.recognize(imagePath, lang);
      return data.text;
    } catch (error) {
      console.error(`[OCR] Text extraction failed for ${imagePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract text from multiple images (batch processing)
   * @param {string[]} imagePaths - Array of image file paths
   * @param {string} language - Language code
   * @returns {Promise<Object>} Object with file paths as keys and extracted text as values
   */
  async extractTextBatch(imagePaths, language = 'eng') {
    const results = {};
    for (const imagePath of imagePaths) {
      try {
        results[imagePath] = await this.extractText(imagePath, language);
      } catch (error) {
        results[imagePath] = `[ERROR] ${error.message}`;
      }
    }
    return results;
  }

  /**
   * Preprocess image before OCR (improve quality)
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output processed image path
   */
  async preprocessImage(inputPath, outputPath) {
    try {
      let image = await Jimp.read(inputPath);
      
      // Resize if too small
      if (image.bitmap.width < 200) {
        image = image.scale(2);
      }

      // Enhance contrast
      image = image.contrast(0.5);

      // Grayscale conversion
      image = image.grayscale();

      await image.write(outputPath);
      console.log(`[OCR] Image preprocessed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('[OCR] Image preprocessing failed:', error.message);
      return inputPath; // Return original if preprocessing fails
    }
  }

  /**
   * Terminate worker
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('[OCR] Worker terminated');
    }
  }
}

export default new OCRModule();
