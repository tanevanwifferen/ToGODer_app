import { store } from '../redux/store';
import { ApiClient } from '../apiClients/ApiClient';
import { AuthService } from './AuthService';
import { BalanceService } from './BalanceService';
import { setGlobalConfig } from '../redux/slices/globalConfigSlice';
import { addChat, setCurrentChat } from '../redux/slices/chatsSlice';
import { setModalVisible } from '../redux/slices/experienceSlice';
import * as Calendar from 'expo-calendar';

export class InitializationService {
  private static readonly selectToken = (state: any) => state.auth.token;
  private static readonly selectIsAuthenticated = (state: any) => Boolean(state.auth.token);
  private static readonly selectAppFirstLaunch = (state: any) => state.globalConfig.appFirstLaunch;

  static async initialize() {
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
    const isFirstLaunch = InitializationService.selectAppFirstLaunch(state);
    
    if (isFirstLaunch) {
      // Show language input modal
      store.dispatch(setModalVisible(true));
      
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
    const isAuthenticated = InitializationService.selectIsAuthenticated(state);
    
    if (isAuthenticated) {
      AuthService.startTokenRefreshService();
      AuthService.startAppFocusHandler();
      // Fetch initial balance if authenticated
      BalanceService.getInstance().fetchBalance();
    }

    // Subscribe to auth state changes
    store.subscribe(() => {
      const currentState = store.getState();
      const currentIsAuthenticated = InitializationService.selectIsAuthenticated(currentState);
      
      if (currentIsAuthenticated && !AuthService.RefreshInterval) {
        AuthService.startTokenRefreshService();
        // Fetch balance when user becomes authenticated
      } else {
        AuthService.stopTokenRefreshService();
      }
    });
  }
}
