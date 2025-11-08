import { useEffect } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

export type QuickActionType = "voicechat" | "morningroutine" | null;

interface QuickActionsHook {
  quickActionType: QuickActionType;
}

/**
 * Hook to handle iOS Quick Actions (3D Touch shortcuts)
 * Returns the type of quick action that was triggered
 */
export function useQuickActions(
  onQuickAction: (actionType: QuickActionType) => void
): void {
  useEffect(() => {
    // Only handle Quick Actions on iOS
    if (Platform.OS !== "ios") {
      return;
    }

    // Check for initial Quick Action when app launches
    const checkInitialAction = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const actionType = parseQuickActionUrl(initialUrl);
          if (actionType) {
            onQuickAction(actionType);
          }
        }
      } catch (error) {
        console.error("Error checking initial Quick Action:", error);
      }
    };

    // Listen for Quick Actions while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      const actionType = parseQuickActionUrl(event.url);
      if (actionType) {
        onQuickAction(actionType);
      }
    });

    checkInitialAction();

    return () => {
      subscription.remove();
    };
  }, [onQuickAction]);
}

/**
 * Parse a URL to determine if it's a Quick Action and what type
 */
function parseQuickActionUrl(url: string): QuickActionType {
  if (!url) return null;

  // Quick Actions use the app's bundle identifier as scheme
  // Format: com.vanWifferen.ToGODer-app://action?type=voicechat
  // Or: togoderapp://quickaction/voicechat

  try {
    const { path, queryParams } = Linking.parse(url);

    // Check if this is a quick action URL
    if (path?.includes("voicechat") || queryParams?.type === "voicechat") {
      return "voicechat";
    }

    if (
      path?.includes("morningroutine") ||
      queryParams?.type === "morningroutine"
    ) {
      return "morningroutine";
    }

    return null;
  } catch (error) {
    console.error("Error parsing Quick Action URL:", error);
    return null;
  }
}
