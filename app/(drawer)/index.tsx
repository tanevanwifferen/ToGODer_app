import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectChatList, addChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "../../components/Chat";
import { ChatList } from "../../components/ChatList";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const chats = useSelector(selectChatList);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Initialize chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      dispatch(addChat({
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
      }));
    }
  }, [chats.length, dispatch]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBack = () => {
    setSelectedChatId(null);
  };

  if (selectedChatId) {
    return <Chat chatId={selectedChatId} onBack={handleBack} />;
  }

  return <ChatList onSelectChat={handleSelectChat} />;
}
