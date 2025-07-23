import CryptoJS from 'crypto-js';
import apiClient from '@/lib/api/client';

export class EncryptionService {
  private static encryptionKey: string | null = null;

  static async initializeEncryption(): Promise<void> {
    try {
      const response = await apiClient.post('/encryption/init');
      this.encryptionKey = response.data.encryptionKey;
    } catch (error) {
      console.error('Error initializing encryption:', error);
      throw error;
    }
  }

  static encrypt(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    return encrypted;
  }

  static decrypt(encryptedData: string): any {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  static isInitialized(): boolean {
    return this.encryptionKey !== null;
  }

  static clearKey(): void {
    this.encryptionKey = null;
  }
}