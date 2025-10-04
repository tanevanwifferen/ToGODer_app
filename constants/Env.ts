// Centralized runtime configuration access for API/share URLs
// Prefer values from app.json -> expo.extra, fall back to EXPO_PUBLIC_* if present
import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  shareUrl?: string;
};

function readExtra(): Extra {
  // Constants.expoConfig?.extra is populated from app.json/expo.extra at runtime
  // Fallbacks are kept for safety if needed during transition
  const extra = (Constants?.expoConfig?.extra ?? {}) as Extra;
  return extra;
}

export function getApiUrl(): string {
  const extra = readExtra();
  return extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";
}

export function getShareUrl(): string {
  const extra = readExtra();
  return extra.shareUrl ?? process.env.EXPO_PUBLIC_SHARE_URL ?? "";
}

export const Env = {
  getApiUrl,
  getShareUrl,
};
