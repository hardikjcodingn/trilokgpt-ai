import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * API Key Manager - Handles generation, validation, and storage of API keys
 * Generates 64-character secure keys using crypto.randomBytes
 */
export class ApiKeyManager {
  constructor() {
    this.keysFile = path.join(__dirname, '../../.api-keys.json');
    this.keys = this.loadKeys();
  }

  /**
   * Generate a new 64-character secure API key
   * Format: "sk_" + 61 random characters (alphanumeric)
   */
  generateKey() {
    const prefix = 'sk_';
    const randomBytes = crypto.randomBytes(48).toString('hex');
    const key = prefix + randomBytes.substring(0, 61);
    return key.substring(0, 64);
  }

  /**
   * Create a new API key with optional name and metadata
   */
  createKey(name = 'Default Key', metadata = {}) {
    const key = this.generateKey();
    const record = {
      key,
      name,
      created: new Date().toISOString(),
      lastUsed: null,
      requestCount: 0,
      metadata
    };

    this.keys.push(record);
    this.saveKeys();

    return {
      key,
      name,
      created: record.created
    };
  }

  /**
   * Validate an API key
   */
  validateKey(key) {
    const record = this.keys.find(k => k.key === key);
    if (!record) {
      return { valid: false, reason: 'Invalid API key' };
    }

    // Update last used time and request count
    record.lastUsed = new Date().toISOString();
    record.requestCount = (record.requestCount || 0) + 1;
    this.saveKeys();

    return { valid: true, record };
  }

  /**
   * Get all keys (admin only)
   */
  getAllKeys() {
    return this.keys.map(k => ({
      key: k.key.substring(0, 4) + '...' + k.key.substring(60),
      name: k.name,
      created: k.created,
      lastUsed: k.lastUsed,
      requestCount: k.requestCount
    }));
  }

  /**
   * Delete an API key
   */
  deleteKey(key) {
    const index = this.keys.findIndex(k => k.key === key);
    if (index !== -1) {
      this.keys.splice(index, 1);
      this.saveKeys();
      return true;
    }
    return false;
  }

  /**
   * Load keys from file
   */
  loadKeys() {
    try {
      if (fs.existsSync(this.keysFile)) {
        const data = fs.readFileSync(this.keysFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
    return [];
  }

  /**
   * Save keys to file
   */
  saveKeys() {
    try {
      fs.writeFileSync(
        this.keysFile,
        JSON.stringify(this.keys, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }
}

export default ApiKeyManager;
