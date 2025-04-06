import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';


import globalConfigReducer from './slices/globalConfigSlice';
import chatsReducer, { ChatsState } from './slices/chatsSlice';
import authReducer, { AuthState } from './slices/authSlice';
import experienceReducer from './slices/experienceSlice';
import balanceReducer from './slices/balanceSlice';
import passcodeReducer from './slices/passcodeSlice';
import personalReducer, { PersonalState } from './slices/personalSlice';
import { personalDataMiddleware } from './middleware/personalDataMiddleware';
import { GlobalConfig } from '../model/GlobalConfig';

export interface RootState {
  globalConfig: GlobalConfig;
  chats: ChatsState;
  auth: AuthState;
  experience: {
    modalVisible: boolean;
  };
  balance: {
    balance: number;
    lastUpdated: string;
    isLoading: boolean;
    error: string | null;
  };
  passcode: {
    passcode: string | null;
    isLocked: boolean;
  };
  personal: PersonalState;
}

const rootReducer = combineReducers({
  globalConfig: globalConfigReducer,
  chats: chatsReducer,
  auth: authReducer,
  experience: experienceReducer,
  balance: balanceReducer,
  passcode: passcodeReducer,
  personal: personalReducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['globalConfig', 'chats', 'auth', 'balance', 'passcode', 'personal'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(personalDataMiddleware),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
