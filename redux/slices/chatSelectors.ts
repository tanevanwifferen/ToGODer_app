import { createSelector } from '@reduxjs/toolkit';
import { ChatsState } from './chatsSlice';

export const selectChatList = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (chats) => Object.values(chats)
);

export const selectChats = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (chats) => Object.values(chats).filter(chat => !chat.isRequest)
);

export const selectChatRequests = createSelector(
  (state: { chats: ChatsState }) => state.chats.chats,
  (chats) => Object.values(chats).filter(chat => chat.isRequest)
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

export const selectLanguage = createSelector(
  (state: { chats: ChatsState }) => state.chats,
  (chats) => chats.language
);
