import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthResponse } from '../../model/AuthRequest';

export interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null,
  password: string | null,
  isAuthenticated: boolean;
  lastTokenRefresh: number | null;
}

const initialState: AuthState = {
  token: null,
  userId: null,
  email: null,
  password: null,
  isAuthenticated: false,
  lastTokenRefresh: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<{email: string, password: string, response: AuthResponse}>) => {
      state.token = action.payload.response.token;
      state.userId = action.payload.response.userId;
      state.email = action.payload.email;
      state.password = action.payload.password;
      state.isAuthenticated = true;
      state.lastTokenRefresh = Date.now();
    },
    clearAuth: (state) => {
      state.token = null;
      state.email = null;
      state.password = null;
      state.userId = null;
      state.isAuthenticated = false;
      state.lastTokenRefresh = null;
    },
    updateTokenRefreshTime: (state) => {
      state.lastTokenRefresh = Date.now();
    }
  },
});

export const { setAuthData, clearAuth, updateTokenRefreshTime } = authSlice.actions;

export const selectAuth = createSelector(
  (state: { auth: AuthState }) => state.auth,
  (auth) => auth
);

export const selectIsAuthenticated = createSelector(
  (state: { auth: AuthState }) => state.auth.isAuthenticated,
  (isAuthenticated) => isAuthenticated
);

export const selectToken = createSelector(
  (state: { auth: AuthState }) => state.auth.token,
  (token) => token
);

export const selectUserId = createSelector(
  (state: { auth: AuthState }) => state.auth.userId,
  (userId) => userId
);

export default authSlice.reducer;
