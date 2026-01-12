import 'react-native-get-random-values';
import { EncryptedSyncData } from './types';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits for AES-256
const IV_LENGTH = 12; // bytes, 96 bits for GCM

/**
 * CryptoService handles encryption and decryption of sync data
 * Uses PBKDF2 for key derivation and AES-256-GCM for encryption
 *
 * Uses standard Web Crypto API which works on:
 * - Web browsers (native)
 * - React Native / Expo (via react-native-get-random-values polyfill)
 */
export class CryptoService {
  private static instance: CryptoService;
  private encryptionKey: CryptoKey | null = null;

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
    const encoder = new TextEncoder();
    const salt = encoder.encode(`togoder-sync-${userId}`);
    const passwordBuffer = encoder.encode(password);

    // Import password as a key for PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
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
  async encrypt(data: string): Promise<EncryptedSyncData> {
    if (!this.encryptionKey) {
      throw new Error('CryptoService not initialized - call deriveKey first');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt with AES-GCM (tag is automatically appended to ciphertext)
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBuffer
    );

    // AES-GCM appends 16-byte auth tag to the ciphertext
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -16);
    const tag = encryptedArray.slice(-16);

    return {
      iv: this.arrayToBase64(iv),
      ciphertext: this.arrayToBase64(ciphertext),
      tag: this.arrayToBase64(tag),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedSyncData): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('CryptoService not initialized - call deriveKey first');
    }

    const iv = this.base64ToArray(encryptedData.iv);
    const ciphertext = this.base64ToArray(encryptedData.ciphertext);
    const tag = this.base64ToArray(encryptedData.tag);

    // Reconstruct the combined ciphertext + tag that AES-GCM expects
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
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
    const plaintext = await this.decrypt(encryptedData);

    // Derive new key and encrypt
    await this.deriveKey(userId, newPassword);
    return this.encrypt(plaintext);
  }

  private arrayToBase64(array: Uint8Array): string {
    // Works in both browser and React Native
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  private base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }
}
