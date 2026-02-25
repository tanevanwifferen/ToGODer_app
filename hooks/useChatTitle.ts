import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setTitle } from "../redux/slices/chatsSlice";
import { ChatApiClient } from "../apiClients/ChatApiClient";
import { IMessage } from "react-native-gifted-chat";
import { selectChatById } from "@/redux/slices/chatSelectors";

export const useChatTitle = (
  chatId: string,
  messages: IMessage[]
): string | undefined => {
  const dispatch = useDispatch();
  const currentChat = useSelector((state) => selectChatById(state, chatId));
  const chatTitle = currentChat?.title || undefined;

  const messagesLength = messages.length;

  useEffect(() => {
    if (chatTitle || messagesLength !== 1) return;
    if (!currentChat?.messages) return;

    const chatMessages = currentChat.messages;
    const fetchTitle = async () => {
      try {
        const title = await ChatApiClient.getTitle(chatMessages);
        dispatch(setTitle({ id: chatId, title }));
      } catch (error) {
        console.error("Failed to fetch title:", error);
      }
    };
    fetchTitle();
    // Only re-run when chatId changes, title appears, or message count changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, chatTitle, messagesLength, dispatch]);

  return chatTitle;
};
