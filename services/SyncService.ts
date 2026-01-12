import { store } from '../redux/store';
import { CryptoService } from './sync/CryptoService';
import { SyncApiClient } from '../apiClients/SyncApiClient';
import { mergeSyncPayloads, hasLocalChanges } from './sync/mergeUtils';
import {
  SyncPayload,
  SyncableChat,
  SyncablePersonal,
  SyncableUserSettings,
  SYNC_VERSION,
} from './sync/types';
import { ChatsState } from '../redux/slices/chatsSlice';
import { PersonalState } from '../redux/slices/personalSlice';
import { UserSettingsState } from '../redux/slices/userSettingsSlice';

const DEBOUNCE_DELAY = 2000; // 2 seconds
const MAX_DEBOUNCE_WAIT = 10000; // 10 seconds max wait

/**
 * SyncService handles encrypted data synchronization between client and server
 * Uses singleton pattern and provides debounced push functionality
 */
export class SyncService {
  private static instance: SyncService;
  private cryptoService: CryptoService;
  private userId: string | null = null;
  private isInitialized = false;
  private pushTimeout: NodeJS.Timeout | null = null;
  private firstPushRequestTime: number | null = null;
  private lastRemoteVersion: number = 0;

  private constructor() {
    this.cryptoService = CryptoService.getInstance();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize the sync service with user credentials
   */
  async initialize(userId: string, password: string): Promise<void> {
    this.userId = userId;
    await this.cryptoService.deriveKey(userId, password);
    this.isInitialized = true;
    console.log('SyncService initialized for user:', userId);
  }

  /**
   * Clear state on logout
   */
  clear(): void {
    this.userId = null;
    this.isInitialized = false;
    this.cryptoService.clearKey();
    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout);
      this.pushTimeout = null;
    }
    this.firstPushRequestTime = null;
    this.lastRemoteVersion = 0;
  }

  /**
   * Check if service is ready to sync
   */
  isReady(): boolean {
    return this.isInitialized && this.cryptoService.isInitialized();
  }

  /**
   * Get local state as SyncPayload
   */
  private getLocalPayload(): SyncPayload {
    const state = store.getState();
    const chatsState = state.chats as ChatsState;
    const personalState = state.personal as PersonalState;
    const userSettingsState = state.userSettings as UserSettingsState | undefined;

    // Convert chats to syncable format
    const syncableChats: Record<string, SyncableChat> = {};
    for (const [id, chat] of Object.entries(chatsState.chats)) {
      syncableChats[id] = {
        ...chat,
        updatedAt: chat.last_update || Date.now(),
      };
    }

    // Get personal data
    const syncablePersonal: SyncablePersonal = {
      data: personalState.data,
      persona: personalState.persona,
      updatedAt: (personalState as any).updatedAt || Date.now(),
    };

    // Get user settings from userSettingsSlice
    const syncableUserSettings: SyncableUserSettings = {
      model: userSettingsState?.model || '',
      humanPrompt: userSettingsState?.humanPrompt ?? true,
      keepGoing: userSettingsState?.keepGoing ?? true,
      outsideBox: userSettingsState?.outsideBox ?? true,
      holisticTherapist: userSettingsState?.holisticTherapist ?? true,
      communicationStyle: userSettingsState?.communicationStyle || 0,
      assistant_name: userSettingsState?.assistant_name || 'ToGODer',
      language: userSettingsState?.language || '',
      libraryIntegrationEnabled: userSettingsState?.libraryIntegrationEnabled ?? false,
      updatedAt: userSettingsState?.updatedAt || Date.now(),
    };

    return {
      version: SYNC_VERSION,
      syncedAt: Date.now(),
      chats: syncableChats,
      personal: syncablePersonal,
      userSettings: syncableUserSettings,
    };
  }

  /**
   * Apply merged payload to Redux store
   */
  private applyPayloadToStore(payload: SyncPayload): void {
    const { setChatsFromSync } = require('../redux/slices/chatsSlice');
    const { setPersonalFromSync } = require('../redux/slices/personalSlice');
    const { setUserSettingsFromSync } = require('../redux/slices/userSettingsSlice');

    // Apply chats
    const chatsForStore: Record<string, any> = {};
    for (const [id, chat] of Object.entries(payload.chats)) {
      const { updatedAt, ...chatData } = chat;
      chatsForStore[id] = {
        ...chatData,
        last_update: updatedAt,
      };
    }
    store.dispatch(setChatsFromSync(chatsForStore));

    // Apply personal data
    store.dispatch(setPersonalFromSync({
      data: payload.personal.data,
      persona: payload.personal.persona,
      updatedAt: payload.personal.updatedAt,
    }));

    // Apply user settings
    const { updatedAt, ...settingsData } = payload.userSettings;
    store.dispatch(setUserSettingsFromSync({
      ...settingsData,
      updatedAt,
    }));
  }

  /**
   * Pull remote data, merge with local, and apply to store
   */
  async pullAndMerge(): Promise<void> {
    if (!this.isReady()) {
      console.warn('SyncService not initialized, skipping pull');
      return;
    }

    try {
      const response = await SyncApiClient.pull();

      if (!response) {
        // No remote data (404), push local data
        console.log('No remote sync data, pushing local data');
        await this.push();
        return;
      }

      this.lastRemoteVersion = response.version;

      // Decrypt remote data
      const decryptedJson = await this.cryptoService.decrypt(response.encryptedData);
      const remotePayload: SyncPayload = JSON.parse(decryptedJson);

      // Get local payload
      const localPayload = this.getLocalPayload();

      // Merge using LWW strategy
      const mergedPayload = mergeSyncPayloads(localPayload, remotePayload);

      // Apply merged data to store
      this.applyPayloadToStore(mergedPayload);

      // If local had newer changes, push the merged result
      const remoteTimestamp = new Date(response.lastModified).getTime();
      if (hasLocalChanges(localPayload, remoteTimestamp)) {
        await this.push();
      }

      console.log('Sync pull and merge completed');
    } catch (error) {
      console.error('Sync pull failed:', error);
      throw error;
    }
  }

  /**
   * Push local data to server
   */
  private async push(): Promise<void> {
    if (!this.isReady()) {
      console.warn('SyncService not initialized, skipping push');
      return;
    }

    try {
      const localPayload = this.getLocalPayload();
      const jsonData = JSON.stringify(localPayload);
      const encryptedData = await this.cryptoService.encrypt(jsonData);

      const response = await SyncApiClient.push(
        encryptedData,
        this.lastRemoteVersion > 0 ? this.lastRemoteVersion : undefined
      );
      this.lastRemoteVersion = response.version;

      console.log('Sync push completed');
    } catch (error) {
      console.error('Sync push failed:', error);
      throw error;
    }
  }

  /**
   * Queue a push with debouncing
   * Waits 2s after last change, but max 10s total wait time
   */
  queuePush(): void {
    if (!this.isReady()) {
      return;
    }

    const now = Date.now();

    // Track first request time for max wait
    if (!this.firstPushRequestTime) {
      this.firstPushRequestTime = now;
    }

    // Clear existing timeout
    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout);
    }

    // Check if we've exceeded max wait time
    const timeSinceFirstRequest = now - this.firstPushRequestTime;
    if (timeSinceFirstRequest >= MAX_DEBOUNCE_WAIT) {
      // Execute immediately
      this.firstPushRequestTime = null;
      this.push().catch(console.error);
      return;
    }

    // Calculate delay (remaining time until max wait, capped at DEBOUNCE_DELAY)
    const remainingMaxWait = MAX_DEBOUNCE_WAIT - timeSinceFirstRequest;
    const delay = Math.min(DEBOUNCE_DELAY, remainingMaxWait);

    this.pushTimeout = setTimeout(() => {
      this.firstPushRequestTime = null;
      this.pushTimeout = null;
      this.push().catch(console.error);
    }, delay);
  }

  /**
   * Handle password change - re-encrypt remote data with new password
   */
  async handlePasswordChange(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.userId) {
      throw new Error('SyncService not initialized');
    }

    try {
      // Fetch current remote data
      const response = await SyncApiClient.pull();

      if (response) {
        // Re-encrypt with new password
        const reEncryptedData = await this.cryptoService.reEncrypt(
          response.encryptedData,
          this.userId,
          oldPassword,
          newPassword
        );

        // Push re-encrypted data
        await SyncApiClient.push(reEncryptedData, response.version);
      }

      // Update service with new password
      await this.initialize(this.userId, newPassword);

      console.log('Password change handled, data re-encrypted');
    } catch (error) {
      console.error('Failed to handle password change:', error);
      throw error;
    }
  }
}
