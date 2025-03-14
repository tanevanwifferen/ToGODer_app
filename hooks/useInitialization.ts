/**
 * Hook for handling app initialization with access to route context.
 * Replaces the static InitializationService to properly handle route-aware initialization.
 */

import { useEffect } from 'react';
import { store } from '../redux/store';
import { ApiClient } from '../apiClients/ApiClient';
import { AuthService } from '../services/AuthService';
import { BalanceService } from '../services/BalanceService';
import { setGlobalConfig } from '../redux/slices/globalConfigSlice';
import { addChat, setCurrentChat } from '../redux/slices/chatsSlice';
import { setModalVisible } from '../redux/slices/experienceSlice';
import * as Calendar from 'expo-calendar';
import { AuthApiClient } from '../apiClients/AuthApiClient';
import { setAuthData } from '../redux/slices/authSlice';
import { useRoute } from '../components/providers/RouteProvider';

export function useInitialization() {
  const { isSharedRoute } = useRoute();

  useEffect(() => {
    const initialize = async () => {
      // Initialize API client with auth store
      ApiClient.initialize();
      await Calendar.requestCalendarPermissionsAsync();

      // Wait for state to be rehydrated
      await new Promise<void>((resolve) => {
        const unsubscribe = store.subscribe(() => {
          const state = store.getState();
          if (state._persist?.rehydrated) {
            unsubscribe();
            resolve();
          }
        });
      });

      // Check if this is first app launch
      const state = store.getState();
      const isFirstLaunch = state.globalConfig.appFirstLaunch;

      if (isFirstLaunch) {
        // Only show language input modal if we're not on a shared route
        if (!isSharedRoute) {
          store.dispatch(setModalVisible(true));
        }

        // Create initial chat
        const newChatId = `chat-${Date.now()}`;
        store.dispatch(addChat({
          id: newChatId,
          messages: [],
          memories: [],
        }));
        store.dispatch(setCurrentChat(newChatId));

        // Mark app as no longer first launch and user as onboarded
        store.dispatch(setGlobalConfig({
          appFirstLaunch: false,
          userOnboarded: true
        }));
      }

      // Start token refresh service if user is authenticated
      let isAuthenticated = Boolean(state.auth.token);
      const { email, password } = state.auth;

      // If we have credentials, always get a fresh token on app start
      if (email && password) {
        try {
          console.log("Fetching fresh token with stored credentials");
          const response = await AuthApiClient.login(email, password);
          store.dispatch(setAuthData({ ...response }));

          // Store credentials in AuthService for potential re-authentication
          AuthService.storeCredentials(email, password);

          isAuthenticated = true;
        } catch (error) {
          console.error("Failed to authenticate with stored credentials:", error);
        }
      }

      if (isAuthenticated) {
        // Start auth services with the fresh token
        AuthService.startAuthServices();
        AuthService.startAppFocusHandler();
        // Fetch initial balance if authenticated
        BalanceService.getInstance().fetchBalance();
      }

      // Subscribe to auth state changes
      store.subscribe(() => {
        const currentState = store.getState();
        const currentIsAuthenticated = Boolean(currentState.auth.token);

        if (currentIsAuthenticated && !AuthService.RefreshInterval) {
          AuthService.startTokenRefreshService();
        } else {
          AuthService.stopTokenRefreshService();
        }
      });
    };

    initialize();
  }, [isSharedRoute]);
}