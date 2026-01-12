import { ApiClient } from './ApiClient';
import { EncryptedSyncData, SyncResponse, SyncPushRequest } from '../services/sync/types';

/**
 * Client for handling sync-related API requests.
 * Provides methods for fetching and pushing encrypted sync data.
 */
export class SyncApiClient {
  /**
   * Fetch the latest sync data from the server
   */
  static async pull(): Promise<SyncResponse> {
    return ApiClient.get<SyncResponse>('/sync');
  }

  /**
   * Push encrypted sync data to the server
   */
  static async push(data: EncryptedSyncData, version: number): Promise<SyncResponse> {
    const request: SyncPushRequest = { data, version };
    return ApiClient.post<SyncResponse>('/sync', request) as Promise<SyncResponse>;
  }

  /**
   * Get the current sync version from the server
   */
  static async getVersion(): Promise<{ version: number; updatedAt: number }> {
    return ApiClient.get<{ version: number; updatedAt: number }>('/sync/version');
  }
}
