import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * File Manager Utility
 * Handles file uploads, storage, and organization
 */

export class FileManager {
  constructor(uploadsDir = './uploads') {
    this.uploadsDir = uploadsDir;
  }

  /**
   * Initialize uploads directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      console.log(`[FileManager] Uploads directory ready: ${this.uploadsDir}`);
    } catch (error) {
      console.error('[FileManager] Initialization error:', error.message);
      throw error;
    }
  }

  /**
   * Save uploaded file
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} File info with ID and path
   */
  async saveFile(file) {
    try {
      const fileId = uuidv4();
      const fileExt = path.extname(file.originalname);
      const fileName = `${fileId}${fileExt}`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      const fileInfo = {
        fileId,
        originalName: file.originalname,
        fileName,
        filePath,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      console.log(`[FileManager] File saved: ${fileInfo.originalName} (${fileId})`);
      return fileInfo;
    } catch (error) {
      console.error('[FileManager] Error saving file:', error.message);
      throw error;
    }
  }

  /**
   * Get file by ID
   * @param {string} fileId - File ID
   * @returns {Promise<Buffer>} File content
   */
  async getFile(fileId) {
    try {
      const uploadDir = this.uploadsDir;
      const files = await fs.readdir(uploadDir);
      
      const fileName = files.find(f => f.startsWith(fileId));
      if (!fileName) {
        throw new Error(`File not found: ${fileId}`);
      }

      const filePath = path.join(uploadDir, fileName);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('[FileManager] Error reading file:', error.message);
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} fileId - File ID
   */
  async deleteFile(fileId) {
    try {
      const uploadDir = this.uploadsDir;
      const files = await fs.readdir(uploadDir);
      
      const fileName = files.find(f => f.startsWith(fileId));
      if (!fileName) {
        throw new Error(`File not found: ${fileId}`);
      }

      const filePath = path.join(uploadDir, fileName);
      await fs.unlink(filePath);
      console.log(`[FileManager] File deleted: ${fileId}`);
    } catch (error) {
      console.error('[FileManager] Error deleting file:', error.message);
      throw error;
    }
  }

  /**
   * List all uploaded files
   * @returns {Promise<Object[]>} Array of file info
   */
  async listFiles() {
    try {
      const files = await fs.readdir(this.uploadsDir);
      const fileInfos = [];

      for (const fileName of files) {
        const filePath = path.join(this.uploadsDir, fileName);
        const stats = await fs.stat(filePath);
        fileInfos.push({
          fileName,
          size: stats.size,
          uploadedAt: stats.birthtime,
        });
      }

      return fileInfos;
    } catch (error) {
      console.error('[FileManager] Error listing files:', error.message);
      return [];
    }
  }

  /**
   * Check if file exists
   * @param {string} fileId - File ID
   * @returns {Promise<boolean>} True if exists
   */
  async fileExists(fileId) {
    try {
      const files = await fs.readdir(this.uploadsDir);
      return files.some(f => f.startsWith(fileId));
    } catch (error) {
      return false;
    }
  }
}

/**
 * Supported file types
 */
export const SUPPORTED_TYPES = {
  PDF: ['application/pdf'],
  DOCX: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  DOC: ['application/msword'],
  TXT: ['text/plain'],
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/tiff', 'image/webp'],
};

/**
 * Check if file type is supported
 * @param {string} mimeType - File MIME type
 * @returns {boolean} Is supported
 */
export function isSupportedType(mimeType) {
  for (const types of Object.values(SUPPORTED_TYPES)) {
    if (types.includes(mimeType)) {
      return true;
    }
  }
  return false;
}

/**
 * Get file type category
 * @param {string} mimeType - File MIME type
 * @returns {string} Type category
 */
export function getFileTypeCategory(mimeType) {
  for (const [category, types] of Object.entries(SUPPORTED_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'UNKNOWN';
}

export default FileManager;
