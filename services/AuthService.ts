import { clearAuth, selectIsAuthenticated, setAuthData } from '@/redux/slices/authSlice';
import { AuthApiClient } from '../apiClients/AuthApiClient';
import { store } from '../redux/store';
import { AppState } from 'react-native';

export class AuthService {
  private static refreshInterval: NodeJS.Timeout | null = null;
  public static get RefreshInterval() {
    return AuthService.refreshInterval;
  }
  private static readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
  private static readonly TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute buffer before token expiry

  private static storedEmail: string | null = null;
  private static storedPassword: string | null = null;
  private static appStateSubscription: any = null;

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
    this.clearStoredCredentials();
    this.stopAppFocusHandler();
  }

  static async checkAndRefreshToken() {
    const state = store.getState();
    const isAuthenticated = selectIsAuthenticated(state);
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
    const isAuthenticated = selectIsAuthenticated(state);
    const lastTokenRefresh = state.auth.lastTokenRefresh;

    if (!isAuthenticated || !lastTokenRefresh) {
      return false;
    }

    // Check if token is within valid timeframe
    const tokenAge = Date.now() - lastTokenRefresh;
    return tokenAge < this.REFRESH_INTERVAL;
  }

  static startAppFocusHandler() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.handleAppFocus();
      }
    });
  }

  static stopAppFocusHandler() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  static storeCredentials(email: string, password: string) {
    this.storedEmail = email;
    this.storedPassword = password;
  }

  static clearStoredCredentials() {
    this.storedEmail = null;
    this.storedPassword = null;
  }

  private static async handleAppFocus() {
    if (this.storedEmail && this.storedPassword) {
      try {
        const response = await AuthApiClient.login(this.storedEmail, this.storedPassword);
        store.dispatch(setAuthData(response));
      } catch (error) {
        store.dispatch(clearAuth());
        console.error('Re-authentication failed:', error);
      }
    }
  }
}
