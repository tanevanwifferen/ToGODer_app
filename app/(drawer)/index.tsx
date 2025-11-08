import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Platform } from 'react-native';
import { addChat, setCurrentChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "../../components/Chat";
import { ChatList } from "../../components/ChatList";
import { selectChatList, selectCurrentChatId } from "@/redux/slices/chatSelectors";
import { selectIsLocked } from "@/redux/slices/passcodeSlice";
import { LockScreen } from "@/components/passcode/LockScreen";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const chats = useSelector(selectChatList);
  const currentChatId = useSelector(selectCurrentChatId);
  const isLocked = useSelector(selectIsLocked);

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
    }
  }, [chats.length, dispatch]);

  const handleBack = () => {
    dispatch(setCurrentChat(null));
  };

  // Show lock screen if app is locked (skip on web)
  if (Platform.OS !== 'web' && isLocked) {
    return <LockScreen />;
  }

  if (currentChatId) {
    return <Chat chatId={currentChatId} onBack={handleBack} />;
  }

  return <ChatList />;
}
