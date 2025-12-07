import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Document Extraction Module
 * Handles PDF, DOCX, TXT, and image files
 */

// Set up PDF.js worker
const pdfjsVersion = '4.0.269';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

export class DocumentExtractor {
  /**
   * Extract text from PDF
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} Extracted text
   */
  static async extractFromPDF(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdf = await pdfjs.getDocument({ data: fileBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX
   * @param {string} filePath - Path to DOCX file
   * @returns {Promise<string>} Extracted text
   */
  static async extractFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from TXT
   * @param {string} filePath - Path to TXT file
   * @returns {Promise<string>} Extracted text
   */
  static async extractFromTXT(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`TXT extraction failed: ${error.message}`);
    }
  }

  /**
   * Main extraction method - auto-detects file type
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} Extracted text
   */
  static async extract(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return this.extractFromPDF(filePath);
      case '.docx':
        return this.extractFromDOCX(filePath);
      case '.txt':
        return this.extractFromTXT(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}

export default DocumentExtractor;
