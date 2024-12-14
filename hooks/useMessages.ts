import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMemories,
  addMessage,
  deleteMessage,
} from "../redux/slices/chatsSlice";
import { useChat } from "../query-hooks/useChat";
import { ApiChatMessage } from "../model/ChatRequest";
import { BalanceService } from "../services/BalanceService";
import { selectChatList } from "../redux/slices/chatSelectors";
import { Chat } from "../redux/slices/chatsSlice";

export const useMessages = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const chats = useSelector(selectChatList) as Chat[];
  const balanceService = BalanceService.getInstance();

  const getCurrentChat = useCallback(() => {
    return chats.find((chat) => chat.id === chatId);
  }, [chatId, chats]);

  const getMessages = useCallback(() => {
    const currentChat = getCurrentChat();
    return currentChat ? currentChat.messages : [];
  }, [getCurrentChat]);

  const onSend = useCallback(
    async (content: string) => {
      const currentChat = getCurrentChat();
      if (!currentChat) return;

      const apiUserMessage: ApiChatMessage = {
        role: "user",
        content,
      };
      dispatch(addMessage({ id: chatId, message: apiUserMessage }));

      try {
        const completeHistory: ApiChatMessage[] = [
          ...currentChat.messages,
          apiUserMessage,
        ];

        const memoriesToInclude = currentChat.memories;
        const response = await sendMessage(
          completeHistory,
          currentChat.memories
        );
        if ("requestForMemory" in response) {
          // request for memory message
          dispatch(
            addMemories({ id: chatId, memories: response.requestForMemory })
          );
          onSend(content);
          return;
        } else {
          // content message
          const apiAssistantMessage: ApiChatMessage = {
            role: "assistant",
            content: response.content,
            updateData: response.updateData,
          };
          dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
          await balanceService.updateBalanceIfAuthenticated();
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [chatId, sendMessage, dispatch, getCurrentChat, balanceService]
  );

  const onDeleteMessage = useCallback(
    (messageIndex: number) => {
      dispatch(deleteMessage({ chatId, messageIndex }));
    },
    [chatId, dispatch]
  );

  return {
    messages: getMessages(),
    onSend,
    onDeleteMessage,
  };
};
