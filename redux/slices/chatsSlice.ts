import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatRequest, ApiChatMessage, ChatSettings } from '../../model/ChatRequest';

export interface Chat {
  id: string;
  title?: string | null;
  messages: ApiChatMessage[];
}

export interface ChatsState extends ChatSettings {
  chats: {
    [id: string]: Chat;
  }
}

const initialState: ChatsState = {
    chats: {},
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
      const chat = state.chats[action.payload.id];
      if (chat) {
        chat.messages.push(action.payload.message);
      }
    },
    updateSettings: (state, action: PayloadAction<ChatSettings>) => {
      return {
        ...state,
        ...action.payload,
        chats: state.chats // Preserve existing chats
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
    }
  },
});

export const { addChat, addMessage, updateSettings, setTitle, deleteChat } = chatsSlice.actions;

export const selectChatList = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (chats) => Object.values(chats)
);

export const selectChatById = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (_: any, chatId: string) => chatId,
  (chats, chatId) => chats[chatId]
);

export const selectModel = createSelector(
  (state: { chats: ChatsState }) => state.chats.model,
  (model) => model
);

export default chatsSlice.reducer;
