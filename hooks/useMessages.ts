import { useCallback, useEffect, useState } from "react";
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
  selectAutoGenerateAnswer,
  selectChatList,
  selectCurrentChat,
  selectCurrentMemories,
  selectCurrentMessages,
} from "../redux/slices/chatSelectors";
import { Chat } from "../redux/slices/chatsSlice";
import StorageService from "../services/StorageService";

export const useMessages = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage, error } = useChat();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const chats = useSelector(selectChatList) as Chat[];
  const balanceService = BalanceService.getInstance();

  const chat = useSelector(selectCurrentChat);
  const memories = useSelector(selectCurrentMemories);
  const messages = useSelector(selectCurrentMessages);
  const autoGenerateAnswer = useSelector(selectAutoGenerateAnswer);

  const retrySend = useCallback(() => {
    setErrorMessage(null);
    if (!chat) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role == "user") {
      dispatch(
        deleteMessage({ chatId, messageIndex: chat.messages.length - 1 })
      );
      onSend(lastMessage.content);
    }
  }, [chatId, dispatch, chat]);

  const onSend = useCallback(
    async (content: string) => {
      if (!chat) return;
      const apiUserMessage: ApiChatMessage = {
        role: "user",
        content,
      };
      dispatch(addMessage({ id: chatId, message: apiUserMessage }));
    },
    [chatId, dispatch, chat]
  );

  useEffect(() => {
    console.log("messages update, autoGenerateAnswer");
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user" && autoGenerateAnswer) {
        sendMessageAndHandleResponse();
      }
    }
  }, [messages, memories]);

  const sendMessageAndHandleResponse = useCallback(async () => {
    if (!chat) return;
    console.log("sendMessageAndHandleResponse");
    setTyping(true);
    const response = await sendMessage(messages, chat.memories);

    if ("requestForMemory" in response) {
      // request for memory message
      var keys = (response.requestForMemory as any).keys as string[];
      keys = keys.filter((x) => StorageService.keyIsValid(x));
      console.log("addkeys", keys);
      dispatch(
        addMemories({
          id: chatId,
          memories: keys
        })
      );
      return;
    }
    // content message
    const apiAssistantMessage: ApiChatMessage = {
      role: "assistant",
      content: response.content,
      updateData: response.updateData,
    };
    dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
    setTyping(false);
    balanceService.updateBalanceIfAuthenticated();
  }, [chatId, sendMessage, dispatch, chat, balanceService]);

  const onDeleteMessage = useCallback(
    (messageIndex: number) => {
      dispatch(deleteMessage({ chatId, messageIndex }));
    },
    [chatId, dispatch]
  );

  useEffect(() => {
      setErrorMessage(error?.message ?? null);
  }, [error]);

  return {
    messages,
    onSend,
    onDeleteMessage,
    typing,
    errorMessage,
    retrySend,
  };
};
