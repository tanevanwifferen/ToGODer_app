import crypto from 'react-native-quick-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';
import { EncryptedSyncData } from './types';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * CryptoService handles encryption and decryption of sync data
 * Uses PBKDF2 for key derivation and AES-256-GCM for encryption
 */
export class CryptoService {
  private static instance: CryptoService;
  private encryptionKey: any = null;

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Derive encryption key from password using PBKDF2
   * Salt is based on userId for deterministic key derivation
   */
  async deriveKey(userId: string, password: string): Promise<void> {
    const salt = `togoder-sync-${userId}`;
    const saltBuffer = Buffer.from(salt, 'utf8');
    const passwordBuffer = Buffer.from(password, 'utf8');

    this.encryptionKey = crypto.pbkdf2Sync(
      passwordBuffer as any,
      saltBuffer as any,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      'SHA-256'
    );
  }

  /**
   * Clear the encryption key (e.g., on logout)
   */
  clearKey(): void {
    this.encryptionKey = null;
  }

  /**
   * Check if the service is initialized with a key
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: string): EncryptedSyncData {
    if (!this.encryptionKey) {
      throw new Error('CryptoService not initialized - call deriveKey first');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv as any);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8') as any,
      cipher.final() as any,
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      ciphertext: encrypted.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedSyncData): string {
    if (!this.encryptionKey) {
      throw new Error('CryptoService not initialized - call deriveKey first');
    }

    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv as any);
    decipher.setAuthTag(tag as any);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext as any) as any,
      decipher.final() as any,
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Re-encrypt data with a new password
   * Used when user changes their password
   */
  async reEncrypt(
    encryptedData: EncryptedSyncData,
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<EncryptedSyncData> {
    // Derive old key and decrypt
    await this.deriveKey(userId, oldPassword);
    const plaintext = this.decrypt(encryptedData);

    // Derive new key and encrypt
    await this.deriveKey(userId, newPassword);
    return this.encrypt(plaintext);
  }
}
