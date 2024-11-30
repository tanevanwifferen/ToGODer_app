import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import createExpoFileSystemStorage from 'redux-persist-expo-filesystem';

import globalConfigReducer from './slices/globalConfigSlice';
import chatsReducer, { ChatsState } from './slices/chatsSlice';
import authReducer, { AuthState } from './slices/authSlice';
import experienceReducer from './slices/experienceSlice';
import { GlobalConfig } from '../model/GlobalConfig';

export interface RootState {
  globalConfig: GlobalConfig;
  chats: ChatsState;
  auth: AuthState;
  experience: {
    modalVisible: boolean;
    inputLanguage: string;
  };
}

const rootReducer = combineReducers({
  globalConfig: globalConfigReducer,
  chats: chatsReducer,
  auth: authReducer,
  experience: experienceReducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: createExpoFileSystemStorage,
  whitelist: ['globalConfig', 'chats', 'auth'],
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
