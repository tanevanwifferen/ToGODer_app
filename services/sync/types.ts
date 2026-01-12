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

export interface EncryptedSyncData {
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface SyncResponse {
  data: EncryptedSyncData | null;
  version: number;
  updatedAt: number;
}

export interface SyncPushRequest {
  data: EncryptedSyncData;
  version: number;
}

export const SYNC_VERSION = 1;
