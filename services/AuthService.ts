import { AuthApiClient } from '../apiClients/AuthApiClient';
import { store } from '../redux/store';
import { setAuthData, clearAuth, selectAuth } from '../redux/slices/authSlice';

export class AuthService {
  private static refreshInterval: NodeJS.Timeout | null = null;
  private static readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
  private static readonly TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute buffer before token expiry

  static startTokenRefreshService() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Start new interval
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.REFRESH_INTERVAL);

    // Do an immediate check
    this.checkAndRefreshToken();
  }

  static stopTokenRefreshService() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  static async checkAndRefreshToken() {
    const state = store.getState();
    const auth = selectAuth(state);

    if (!auth.isAuthenticated || !auth.userId) {
      return;
    }

    // Check if token needs refresh (if last refresh was more than 14 minutes ago)
    const shouldRefresh = auth.lastTokenRefresh && 
      (Date.now() - auth.lastTokenRefresh > this.REFRESH_INTERVAL - this.TOKEN_EXPIRY_BUFFER);

    if (shouldRefresh) {
      try {
        const response = await AuthApiClient.refreshToken(auth.userId);
        store.dispatch(setAuthData(response));
      } catch (error) {
        // If refresh fails, clear auth state
        store.dispatch(clearAuth());
        console.error('Token refresh failed:', error);
      }
    }
  }

  static isTokenValid(): boolean {
    const state = store.getState();
    const auth = selectAuth(state);

    if (!auth.isAuthenticated || !auth.lastTokenRefresh) {
      return false;
    }

    // Check if token is within valid timeframe
    const tokenAge = Date.now() - auth.lastTokenRefresh;
    return tokenAge < this.REFRESH_INTERVAL;
  }
}
