import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiChatMessage, ChatSettings } from '../../model/ChatRequest';

export interface Chat {
  id: string;
  title?: string | null;
  messages: ApiChatMessage[];
  isRequest: boolean;
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
    model: 'meta-llama/llama-3.2-90b-vision-instruct',
    humanPrompt: true,
    keepGoing: true,
    outsideBox: true,
    communicationStyle: 2,
    assistant_name: "ToGODer",
    language: undefined
};

const chatsSlice = createSlice({
  name:"chats",
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<Omit<Chat, 'isRequest'> & { isRequest?: boolean }>) => {
      state.chats[action.payload.id] = {
        ...action.payload,
        isRequest: action.payload.isRequest ?? false
      };
    },
    addMessage: (state, action: PayloadAction<{ id: string; message: ApiChatMessage }>) => {
      const { id, message } = action.payload;
      const chat = state.chats[id];
      delete message.updateData;
      chat.messages.push({
        ...message,
        timestamp: new Date().toISOString()
      });
    },
    deleteMessage: (state, action: PayloadAction<{ chatId: string; messageIndex: number }>) => {
      const { chatId, messageIndex } = action.payload;
      const chat = state.chats[chatId];
      if (chat && messageIndex >= 0 && messageIndex < chat.messages.length) {
        chat.messages.splice(messageIndex, 1);
      }
    },
    updateSettings: (state, action: PayloadAction<Partial<ChatSettings>>) => {
      console.log("old_state", state.humanPrompt);
      console.log("new_state", action.payload);
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
    },
    clearAllChats: (state) => {
      state.chats = {};
      state.currentChatId = null;
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
  setCurrentChat,
  clearAllChats 
} = chatsSlice.actions;

export default chatsSlice.reducer;
