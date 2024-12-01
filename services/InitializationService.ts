import { store } from '../redux/store';
import { ApiClient } from '../apiClients/ApiClient';
import { AuthService } from './AuthService';
import { BalanceService } from './BalanceService';

export class InitializationService {
  private static readonly selectToken = (state: any) => state.auth.token;
  private static readonly selectIsAuthenticated = (state: any) => Boolean(state.auth.token);

  static initialize() {
    // Initialize API client with auth store
    ApiClient.initialize();

    // Start token refresh service if user is authenticated
    const state = store.getState();
    const isAuthenticated = InitializationService.selectIsAuthenticated(state);
    
    if (isAuthenticated) {
      AuthService.startTokenRefreshService();
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
