import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import BackgroundFetch from "react-native-background-fetch";
import {
  selectBackgroundServiceEnabled,
  selectBackgroundServicePreferredHour,
} from "../redux/slices/backgroundServiceSlice";
import { platform } from "os";
import { Platform } from "react-native";

export const useBackgroundFetch = () => {
  const enabled = useSelector(selectBackgroundServiceEnabled);
  const preferredHour = useSelector(selectBackgroundServicePreferredHour);
  const [lastFetch, setLastFetch] = useState(new Date());

  useEffect(() => {
    const configureBackgroundFetch = async () => {
      try {
        // Configure background fetch
        await BackgroundFetch.configure(
          {
            minimumFetchInterval: 15, // Fetch every 15 minutes
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
          },
          async (taskId) => {
            // This is where we'll implement the background task
            console.log("[BackgroundFetch] Task received:", taskId);

            // Check if it's the preferred hour
            const now = new Date();
            const currentHour = now.getHours();

            try {
              if (currentHour !== preferredHour 
                || lastFetch.getTime() > now.getTime() - 1000 * 60 * 60 * 2) {
                console.log(
                    "[BackgroundFetch] Running not running, waiting for preferred hour:",
                    preferredHour
                );
                return;
              }
              setLastFetch(now);
              console.log(
                "[BackgroundFetch] Running at preferred hour:",
                preferredHour
              );
            } finally {
              // Required: Signal completion of the task
              BackgroundFetch.finish(taskId);
            }
          },
          (timeoutId) => {
            BackgroundFetch.finish(timeoutId);
            console.log("[BackgroundFetch] Task timeout:", timeoutId);
          }
        );

        // Enable/disable based on settings
        if (enabled && Platform.OS !== "web") {
          await BackgroundFetch.start();
        } else {
          await BackgroundFetch.stop();
        }
      } catch (error) {
        console.error("[BackgroundFetch] Configure error:", error);
      }
    };

    configureBackgroundFetch();

    // Cleanup
    return () => {
      BackgroundFetch.stop();
    };
  }, [enabled, preferredHour]);
};
