import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMemories,
  addMessage,
  deleteMessage,
  deleteMessageByContent,
} from "../redux/slices/chatsSlice";
import { useChat } from "../query-hooks/useChat";
import { ApiChatMessage } from "../model/ChatRequest";
import { BalanceService } from "../services/BalanceService";
import {
  selectChatList,
  selectCurrentChat,
  selectCurrentMessages,
} from "../redux/slices/chatSelectors";
import { Chat } from "../redux/slices/chatsSlice";
import { setError } from "@/redux/slices/balanceSlice";
import StorageService from "@/services/StorageService";

export const useMessages = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const chats = useSelector(selectChatList) as Chat[];
  const balanceService = BalanceService.getInstance();

  const chat = useSelector(selectCurrentChat);
  const messages = useSelector(selectCurrentMessages);

  const retrySend = useCallback(() => {
    setErrorMessage(null);
    if (!chat) return;
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage.role == "user") {
      dispatch(
        deleteMessage({ chatId, messageIndex: chat.messages.length - 1 })
      );
      onSend(lastMessage.content);
    }
  }, []);

  const onSend = useCallback(
    async (content: string) => {
      if (!chat) return;
      setTyping(true);
      const apiUserMessage: ApiChatMessage = {
        role: "user",
        content,
      };
      dispatch(addMessage({ id: chatId, message: apiUserMessage }));
      try {
        await sendMessageAndHandleResponse();
      } catch (e: any) {
        console.error("Failed to send message:", e);
        if (e.type == "RateLimit") {
          setErrorMessage(
            `Rate limit reached. Please wait ${e.minutes}:${e.seconds} minutes before sending another message.`
          );
        }
      } finally {
        setTyping(false);
      }
    },
    [chatId, sendMessage, dispatch, chat, balanceService]
  );

  const sendMessageAndHandleResponse = useCallback(async () => {
    if (!chat) return;
    const response = await sendMessage(messages, chat.memories);

    if ("requestForMemory" in response) {
      // request for memory message
      var keys = (response.requestForMemory as any).keys as string[];
      dispatch(
        addMemories({
          id: chatId,
          memories: keys.filter((x) => StorageService.keyIsValid(x)),
        })
      );
      sendMessageAndHandleResponse();
      return;
    }
    // content message
    const apiAssistantMessage: ApiChatMessage = {
      role: "assistant",
      content: response.content,
      updateData: response.updateData,
    };
    dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
    await balanceService.updateBalanceIfAuthenticated();
  }, [chatId, sendMessage, dispatch, chat, balanceService]);

  const onDeleteMessage = useCallback(
    (messageIndex: number) => {
      dispatch(deleteMessage({ chatId, messageIndex }));
    },
    [chatId, dispatch]
  );

  return {
    messages,
    onSend,
    onDeleteMessage,
    typing,
    errorMessage,
    retrySend,
  };
};
