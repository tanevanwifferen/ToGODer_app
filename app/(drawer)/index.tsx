import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { router } from "expo-router";
import { addChat, setCurrentChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { ChatList } from "../../components/ChatList";
import { selectChatList } from "@/redux/slices/chatSelectors";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const chats = useSelector(selectChatList);

  // Initialize chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      const newChatId = uuidv4();
      dispatch(addChat({
        id: newChatId,
        title: '',
        messages: [],
        memories: []
      }));
      dispatch(setCurrentChat(newChatId));
      router.push({ pathname: '/chat/[id]', params: { id: newChatId } });
    }
  }, [chats.length, dispatch]);

  return <ChatList />;
}
