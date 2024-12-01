import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import createExpoFileSystemStorage from 'redux-persist-expo-filesystem';

import globalConfigReducer from './slices/globalConfigSlice';
import chatsReducer, { ChatsState } from './slices/chatsSlice';
import authReducer, { AuthState } from './slices/authSlice';
import experienceReducer from './slices/experienceSlice';
import balanceReducer from './slices/balanceSlice';
import backgroundServiceReducer from './slices/backgroundServiceSlice';
import passcodeReducer from './slices/passcodeSlice';
import { GlobalConfig } from '../model/GlobalConfig';
import { BackgroundServiceConfig } from '../model/BackgroundService';

export interface RootState {
  globalConfig: GlobalConfig;
  chats: ChatsState;
  auth: AuthState;
  experience: {
    modalVisible: boolean;
    inputLanguage: string;
  };
  balance: {
    balance: number;
    lastUpdated: string;
    isLoading: boolean;
    error: string | null;
  };
  backgroundService: BackgroundServiceConfig;
  passcode: {
    passcode: string | null;
    isLocked: boolean;
  };
}

const rootReducer = combineReducers({
  globalConfig: globalConfigReducer,
  chats: chatsReducer,
  auth: authReducer,
  experience: experienceReducer,
  balance: balanceReducer,
  backgroundService: backgroundServiceReducer,
  passcode: passcodeReducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: createExpoFileSystemStorage,
  whitelist: ['globalConfig', 'chats', 'auth', 'balance', 'backgroundService', 'passcode'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
