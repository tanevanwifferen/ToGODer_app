import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiChatMessage, ChatSettings } from '../../model/ChatRequest';

export interface Chat {
  id: string;
  title?: string | null;
  messages: ApiChatMessage[];
}

export interface ChatsState extends ChatSettings {
  chats: {
    [id: string]: Chat;
  };
  currentChatId: string | null;
}

const initialState: ChatsState = {
    chats: {},
    currentChatId: null,
    model: 'llama-3.2-90b',
    humanPrompt: false,
    keepGoing: false,
    outsideBox: false,
    communicationStyle: 0,
    assistant_name: undefined
};

const chatsSlice = createSlice({
  name:"chats",
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats[action.payload.id] = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ id: string; message: ApiChatMessage }>) => {
      const { id, message } = action.payload;
      const chat = state.chats[id];
      chat.messages.push(message);
    },
    deleteMessage: (state, action: PayloadAction<{ chatId: string; messageIndex: number }>) => {
      const { chatId, messageIndex } = action.payload;
      const chat = state.chats[chatId];
      if (chat && messageIndex >= 0 && messageIndex < chat.messages.length) {
        chat.messages.splice(messageIndex, 1);
      }
    },
    updateSettings: (state, action: PayloadAction<Partial<ChatSettings>>) => {
      return {
        ...state,
        ...action.payload,
        chats: state.chats, // Preserve existing chats
        currentChatId: state.currentChatId // Preserve current chat id
      };
    },
    setTitle: (state, action: PayloadAction<{id: string, title: string}>) => {
      const chat = state.chats[action.payload.id];
      if (chat) {
        chat.title = action.payload.title;
      }
    },
    deleteChat: (state, action: PayloadAction<string>) => {
      delete state.chats[action.payload];
      if (state.currentChatId === action.payload) {
        state.currentChatId = null;
      }
    },
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    }
  },
});

export const { 
  addChat, 
  addMessage,
  deleteMessage,
  updateSettings, 
  setTitle, 
  deleteChat,
  setCurrentChat 
} = chatsSlice.actions;

export const selectChatList = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (chats) => Object.values(chats)
);

export const selectChatById = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (_: any, chatId: string) => chatId,
  (chats, chatId) => chats[chatId]
);

export const selectCurrentChatId = (state: { chats: ChatsState }) => state.chats.currentChatId;

export const selectCurrentChat = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  selectCurrentChatId,
  (chats, currentChatId) => currentChatId ? chats[currentChatId] : null
);

export const selectModel = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.model
);

export const selectKeepGoing = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.keepGoing
);

export const selectOutsideBox = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.outsideBox
);

export const selectCommunicationStyle = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.communicationStyle
);

export const selectHumanPrompt = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.humanPrompt
);

export default chatsSlice.reducer;
