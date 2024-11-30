import { store } from '../redux/store';
import { ApiClient } from '../apiClients/ApiClient';
import { AuthService } from './AuthService';
import { selectAuth } from '../redux/slices/authSlice';

export class InitializationService {
  static initialize() {
    // Initialize API client with auth store
    ApiClient.initialize({
      get token() {
        return selectAuth(store.getState()).token;
      }
    });

    // Start token refresh service if user is authenticated
    const auth = selectAuth(store.getState());
    if (auth.isAuthenticated) {
      AuthService.startTokenRefreshService();
    }

    // Subscribe to auth state changes
    store.subscribe(() => {
      const currentAuth = selectAuth(store.getState());
      
      if (currentAuth.isAuthenticated) {
        AuthService.startTokenRefreshService();
      } else {
        AuthService.stopTokenRefreshService();
      }
    });
  }
}
