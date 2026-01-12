import { SyncPayload, SyncableChat, SyncablePersonal, SyncableUserSettings } from './types';

/**
 * Merge utilities using Last-Writer-Wins (LWW) strategy
 * Higher updatedAt timestamp wins
 */

interface Timestamped {
  updatedAt: number;
}

/**
 * Compare two timestamped objects, return the one with higher timestamp
 */
function lwwMerge<T extends Timestamped>(local: T | undefined, remote: T | undefined): T | undefined {
  if (!local && !remote) return undefined;
  if (!local) return remote;
  if (!remote) return local;

  return local.updatedAt >= remote.updatedAt ? local : remote;
}

/**
 * Merge chat records using LWW strategy
 * Handles chats that exist on one side only
 */
export function mergeChats(
  local: Record<string, SyncableChat>,
  remote: Record<string, SyncableChat>
): Record<string, SyncableChat> {
  const merged: Record<string, SyncableChat> = {};
  const allIds = new Set([...Object.keys(local), ...Object.keys(remote)]);

  for (const id of allIds) {
    const localChat = local[id];
    const remoteChat = remote[id];
    const winner = lwwMerge(localChat, remoteChat);
    if (winner) {
      merged[id] = winner;
    }
  }

  return merged;
}

/**
 * Merge personal data using LWW strategy
 */
export function mergePersonal(
  local: SyncablePersonal | undefined,
  remote: SyncablePersonal | undefined
): SyncablePersonal | undefined {
  return lwwMerge(local, remote);
}

/**
 * Merge user settings using LWW strategy
 */
export function mergeUserSettings(
  local: SyncableUserSettings | undefined,
  remote: SyncableUserSettings | undefined
): SyncableUserSettings | undefined {
  return lwwMerge(local, remote);
}

/**
 * Merge complete sync payloads
 */
export function mergeSyncPayloads(
  local: SyncPayload,
  remote: SyncPayload
): SyncPayload {
  return {
    version: Math.max(local.version, remote.version),
    syncedAt: Date.now(),
    chats: mergeChats(local.chats, remote.chats),
    personal: mergePersonal(local.personal, remote.personal) || local.personal,
    userSettings: mergeUserSettings(local.userSettings, remote.userSettings) || local.userSettings,
  };
}

/**
 * Check if local data is newer than remote
 */
export function hasLocalChanges(local: SyncPayload, remoteUpdatedAt: number): boolean {
  // Check if any chat is newer
  for (const chat of Object.values(local.chats)) {
    if (chat.updatedAt > remoteUpdatedAt) return true;
  }

  // Check personal data
  if (local.personal.updatedAt > remoteUpdatedAt) return true;

  // Check user settings
  if (local.userSettings.updatedAt > remoteUpdatedAt) return true;

  return false;
}
