import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static encryptionKey: string | null = null;

  static async initializeEncryption(): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/encryption/init`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize encryption');
      }

      const data = await response.json();
      this.encryptionKey = data.key;
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