import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiChatMessage, ChatSettings } from "../../model/ChatRequest";

export interface Chat {
  id: string;
  title?: string | null;
  messages: ApiChatMessage[];
  isRequest: boolean;
  last_update?: number;
  memories: string[];
  draftInputText?: string;
}

export interface ChatsState extends ChatSettings {
  chats: {
    [id: string]: Chat;
  };
  currentChatId: string | null;
  // false if a message, got deleted, true when a message just got added
  auto_generate_answer: boolean;
}

const initialState: ChatsState = {
  chats: {},
  currentChatId: null,
  model: "meta-llama/llama-3.2-90b-vision-instruct",
  humanPrompt: true,
  keepGoing: true,
  outsideBox: true,
  holisticTherapist: true,
  communicationStyle: 2,
  assistant_name: "ToGODer",
  language: "",
  auto_generate_answer: true,
};

const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    addChat: (
      state,
      action: PayloadAction<Omit<Chat, "isRequest"> & { isRequest?: boolean }>
    ) => {
      state.chats[action.payload.id] = {
        ...action.payload,
        isRequest: action.payload.isRequest ?? false,
        last_update: new Date().getTime(),
      };
    },
    addMessage: (
      state,
      action: PayloadAction<{ id: string; message: ApiChatMessage }>
    ) => {
      const { id, message } = action.payload;
      const chat = state.chats[id];
      if (!chat) {
        console.warn(`Chat ${id} not found when adding message`);
        return;
      }
      delete message.updateData;
      chat.messages.push({
        ...message,
        timestamp: message.timestamp || new Date().getTime(),
      });
      // Do not sort messages here; keep insertion order so streaming updates
      // using messageIndex remain stable for the just-appended placeholder.
      chat.last_update = new Date().getTime();
      // Only auto-generate when a USER message is appended; assistant/system should not flip this on
      state.auto_generate_answer = message.role === "user";
    },
    // New: update message content/signature at a specific index (for streaming)
    updateMessageAtIndex: (
      state,
      action: PayloadAction<{
        chatId: string;
        messageIndex: number;
        content?: string;
        signature?: string;
      }>
    ) => {
      const { chatId, messageIndex, content, signature } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) {
        console.warn(`Chat ${chatId} not found when updating message`);
        return;
      }
      if (messageIndex < 0 || messageIndex >= chat.messages.length) {
        console.warn(
          `Invalid message index ${messageIndex} for chat ${chatId}`
        );
        return;
      }

      // Important: produce a NEW array reference so useSelector(selectCurrentMessages)
      // sees a changed value and components re-render (RN iOS was not updating).
      const newMessages = chat.messages.map((m, i) =>
        i === messageIndex
          ? {
              ...m,
              content: content !== undefined ? content : m.content,
              signature:
                signature !== undefined ? signature : (m as any).signature,
              timestamp: m.timestamp || new Date().getTime(),
            }
          : m
      );

      chat.messages = newMessages;
      chat.last_update = new Date().getTime();
      // Don't change auto_generate_answer when updating message content
    },
    deleteMessage: (
      state,
      action: PayloadAction<{ chatId: string; messageIndex: number }>
    ) => {
      const { chatId, messageIndex } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) {
        console.warn(`Chat ${chatId} not found when deleting message`);
        return;
      }
      if (messageIndex >= 0 && messageIndex < chat.messages.length) {
        // Create new array to trigger re-render
        chat.messages = chat.messages.filter((_, i) => i !== messageIndex);
        chat.last_update = new Date().getTime();
      }
      state.auto_generate_answer = false;
    },
    deleteMessageByContent: (
      state,
      action: PayloadAction<{ chatId: string; content: string }>
    ) => {
      const { chatId, content } = action.payload;
      const chat = state.chats[chatId];
      const messageIndex = chat.messages.findIndex(
        (message) => message.content === content
      );
      if (chat && messageIndex >= 0) {
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
        currentChatId: state.currentChatId, // Preserve current chat id
      };
    },
    setTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
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
    },
    addMemories: (
      state,
      action: PayloadAction<{ id: string; memories: string[] }>
    ) => {
      var existing = state.chats[action.payload.id].memories;
      console.log("existing", existing);
      for (let memory of action.payload.memories) {
        if (existing.includes(memory)) {
          continue;
        }
        console.log("adding", memory);
        existing.push(memory);
      }
    },
    updateDraftInputText: (
      state,
      action: PayloadAction<{ chatId: string; text: string }>
    ) => {
      const { chatId, text } = action.payload;
      const chat = state.chats[chatId];
      if (chat) {
        chat.draftInputText = text;
      }
    },
    // Explicitly control whether the UI should auto-trigger a response.
    // This lets us turn it off as soon as a send starts to prevent duplicates.
    setAutoGenerateAnswer: (state, action: PayloadAction<boolean>) => {
      state.auto_generate_answer = action.payload;
    },
  },
});

export const {
  addChat,
  addMessage,
  updateMessageAtIndex,
  deleteMessage,
  deleteMessageByContent,
  updateSettings,
  setTitle,
  deleteChat,
  setCurrentChat,
  clearAllChats,
  addMemories,
  updateDraftInputText,
  setAutoGenerateAnswer,
} = chatsSlice.actions;

export default chatsSlice.reducer;
