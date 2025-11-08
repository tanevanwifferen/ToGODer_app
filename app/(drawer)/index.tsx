import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { addChat, setCurrentChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "../../components/Chat";
import { ChatList } from "../../components/ChatList";
import { selectChatList, selectCurrentChatId } from "@/redux/slices/chatSelectors";
import { selectIsLocked, selectBypassLock, resetBypassLock, unlockApp } from "@/redux/slices/passcodeSlice";
import { LockScreen } from "@/components/passcode/LockScreen";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const chats = useSelector(selectChatList);
  const currentChatId = useSelector(selectCurrentChatId);
  const isLocked = useSelector(selectIsLocked);
  const bypassLock = useSelector(selectBypassLock);

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

  // Reset bypass lock when accessing chats (normal app flow)
  useEffect(() => {
    if (bypassLock) {
      dispatch(resetBypassLock());
    }
  }, [bypassLock, dispatch]);

  const handleBack = () => {
    dispatch(setCurrentChat(null));
  };

  // Show lock screen if app is locked (skip on web and when bypassed)
  // If bypass is active, redirect to morning routine instead of showing lock screen
  if (Platform.OS !== 'web' && isLocked) {
    if (bypassLock) {
      // Auto-unlock and redirect to morning routine
      dispatch(unlockApp());
      router.push('/(drawer)/morning-routine');
      return null;
    }
    return <LockScreen />;
  }

  if (currentChatId) {
    return <Chat chatId={currentChatId} onBack={handleBack} />;
  }

  return <ChatList />;
}
