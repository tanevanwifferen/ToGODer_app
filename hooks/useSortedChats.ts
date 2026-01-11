import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectChats, selectChatRequests, selectChatList } from "../redux/slices/chatSelectors";
import { Chat, ChatsState } from "../redux/slices/chatsSlice";

const selectChatsMap = (state: { chats: ChatsState }) => state.chats.chats;

export const useSortedChats = () => {
  const chatRequests = useSelector(selectChatRequests);
  const regularChats = useSelector(selectChats);
  const chatsMap = useSelector(selectChatsMap);
  const [sortedChatRequests, setSortedChatRequests] = useState<Chat[]>([]);
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);

  useEffect(() => {
    const sortedRequests = chatRequests.sort((a, b) =>
      (b.last_update ?? 0) - (a.last_update ?? 0) < 0 ? -1 : 1
    );
    setSortedChatRequests(sortedRequests);
  }, [chatRequests]);

  useEffect(() => {
    const sorted = regularChats.sort((a, b) =>
      (b.last_update ?? 0) - (a.last_update ?? 0) < 0 ? -1 : 1
    );
    setSortedChats(sorted);
  }, [regularChats]);

  return {
    sortedChatRequests,
    sortedChats,
    hasRequests: chatRequests.length > 0,
    chatsMap,
  };
};
