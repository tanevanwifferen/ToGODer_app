import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectChatList, addChat, selectCurrentChatId, setCurrentChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "../../components/Chat";
import { ChatList } from "../../components/ChatList";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const chats = useSelector(selectChatList);
  const currentChatId = useSelector(selectCurrentChatId);

  // Initialize chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      const newChatId = uuidv4();
      dispatch(addChat({
        id: newChatId,
        title: 'New Chat',
        messages: [],
      }));
      dispatch(setCurrentChat(newChatId));
    }
  }, [chats.length, dispatch]);

  const handleBack = () => {
    dispatch(setCurrentChat(null));
  };

  if (currentChatId) {
    return <Chat chatId={currentChatId} onBack={handleBack} />;
  }

  return <ChatList />;
}
