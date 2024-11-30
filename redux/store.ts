import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import createExpoFileSystemStorage from 'redux-persist-expo-filesystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

import globalConfigReducer from './slices/globalConfigSlice';
import chatsReducer, { ChatsState } from './slices/chatsSlice';
import { GlobalConfig } from '../model/GlobalConfig';
import { Chat } from './slices/chatsSlice';

export interface RootState {
  globalConfig: GlobalConfig;
  chats: ChatsState;
}

const rootReducer = combineReducers({
  globalConfig: globalConfigReducer,
  chats: chatsReducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: createExpoFileSystemStorage,
  whitelist: ['globalConfig', 'chats'],
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
