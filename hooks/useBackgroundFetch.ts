import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import BackgroundFetch from 'react-native-background-fetch';
import { selectBackgroundServiceEnabled, selectBackgroundServicePreferredHour } from '../redux/slices/backgroundServiceSlice';

export const useBackgroundFetch = () => {
    const enabled = useSelector(selectBackgroundServiceEnabled);
    const preferredHour = useSelector(selectBackgroundServicePreferredHour);

    useEffect(() => {
        const configureBackgroundFetch = async () => {
            try {
                // Configure background fetch
                await BackgroundFetch.configure({
                    minimumFetchInterval: 15, // Fetch every 15 minutes
                    stopOnTerminate: false,
                    startOnBoot: true,
                    enableHeadless: true,
                }, async (taskId) => {
                    // This is where we'll implement the background task
                    console.log('[BackgroundFetch] Task received:', taskId);

                    // Check if it's the preferred hour
                    const now = new Date();
                    const currentHour = now.getHours();
                    
                    if (currentHour === preferredHour) {
                        // TODO: Implement background task
                        console.log('[BackgroundFetch] Running at preferred hour:', preferredHour);
                    }

                    // Required: Signal completion of the task
                    BackgroundFetch.finish(taskId);
                }, (error) => {
                    console.log('[BackgroundFetch] Failed to configure:', error);
                });

                // Enable/disable based on settings
                if (enabled) {
                    await BackgroundFetch.start();
                } else {
                    await BackgroundFetch.stop();
                }

            } catch (error) {
                console.error('[BackgroundFetch] Configure error:', error);
            }
        };

        configureBackgroundFetch();

        // Cleanup
        return () => {
            BackgroundFetch.stop();
        };
    }, [enabled, preferredHour]);
};
