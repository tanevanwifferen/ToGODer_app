import { ApiChatMessage, ChatSettings } from "../../model/ChatRequest";

/**
 * Sync payload types for encrypted data synchronization
 */

export interface SyncableChat {
  id: string;
  title?: string | null;
  messages: ApiChatMessage[];
  isRequest: boolean;
  last_update?: number;
  memories: string[];
  draftInputText?: string;
  updatedAt: number;
}

export interface SyncablePersonal {
  data: any;
  persona: string;
  updatedAt: number;
}

export interface SyncableUserSettings extends ChatSettings {
  updatedAt: number;
}

export interface SyncPayload {
  version: number;
  syncedAt: number;
  chats: Record<string, SyncableChat>;
  personal: SyncablePersonal;
  userSettings: SyncableUserSettings;
}

/**
 * Internal encrypted data structure (iv + ciphertext + tag)
 * Used internally by CryptoService before combining into single blob
 */
export interface EncryptedParts {
  iv: string;
  ciphertext: string;
  tag: string;
}

/**
 * API response from GET /api/sync
 */
export interface SyncPullResponse {
  encryptedData: string;
  version: number;
  lastModified: string;
}

/**
 * API request for POST /api/sync
 */
export interface SyncPushRequest {
  encryptedData: string;
  version?: number;
}

/**
 * API response from POST /api/sync
 */
export interface SyncPushResponse {
  success: boolean;
  version: number;
  lastModified: string;
}

export const SYNC_VERSION = 1;

/**
 * Interface for CryptoService implementations
 * Implemented by platform-specific services (iOS, Android, Web)
 */
export interface ICryptoService {
  /**
   * Derive encryption key from password using PBKDF2
   * Salt is based on userId for deterministic key derivation
   */
  deriveKey(userId: string, password: string): Promise<void>;

  /**
   * Clear the encryption key (e.g., on logout)
   */
  clearKey(): void;

  /**
   * Check if the service is initialized with a key
   */
  isInitialized(): boolean;

  /**
   * Encrypt data using AES-256-GCM
   * Returns a single base64 blob: [IV][ciphertext][tag]
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypt data using AES-256-GCM
   * Expects a single base64 blob: [IV][ciphertext][tag]
   */
  decrypt(encryptedBlob: string): Promise<string>;

  /**
   * Re-encrypt data with a new password
   * Used when user changes their password
   */
  reEncrypt(
    encryptedBlob: string,
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<string>;
}
