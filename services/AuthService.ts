import { clearAuth, setAuthData } from '@/redux/slices/authSlice';
import { AuthApiClient } from '../apiClients/AuthApiClient';
import { store } from '../redux/store';

export class AuthService {
  private static refreshInterval: NodeJS.Timeout | null = null;
  public static get RefreshInterval() {
    return AuthService.refreshInterval;
  }
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
    const isAuthenticated = state.auth.isAuthenticated;
    const userId = state.auth.userId;
    const lastTokenRefresh = state.auth.lastTokenRefresh;

    if (!isAuthenticated || !userId) {
      return;
    }

    // Check if token needs refresh (if last refresh was more than 14 minutes ago)
    const shouldRefresh = lastTokenRefresh && 
      (Date.now() - lastTokenRefresh > this.REFRESH_INTERVAL - this.TOKEN_EXPIRY_BUFFER);

    if (shouldRefresh) {
      try {
        const response = await AuthApiClient.refreshToken(userId);
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
    const isAuthenticated = state.auth.isAuthenticated;
    const lastTokenRefresh = state.auth.lastTokenRefresh;

    if (!isAuthenticated || !lastTokenRefresh) {
      return false;
    }

    // Check if token is within valid timeframe
    const tokenAge = Date.now() - lastTokenRefresh;
    return tokenAge < this.REFRESH_INTERVAL;
  }
}
