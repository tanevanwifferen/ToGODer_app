import { ApiChatMessage, ChatSettings } from '../../model/ChatRequest';

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
