import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTitle } from '../redux/slices/chatsSlice';
import { ChatApiClient } from '../apiClients/ChatApiClient';
import { IMessage } from 'react-native-gifted-chat';
import { selectChatList, selectChatById } from '@/redux/slices/chatSelectors';

export const useChatTitle = (chatId: string, messages: IMessage[]): string | undefined => {
  const dispatch = useDispatch();
  const chats = useSelector(selectChatList);
  const currentChat = useSelector(state => selectChatById(state, chatId));
  const chatTitle = currentChat?.title || undefined;

  useEffect(() => {
    const fetchTitle = async () => {
      const currentChat = chats.find(chat => chat.id === chatId);
      if (currentChat && !currentChat.title && messages.length > 0) {
        try {
          const title = await ChatApiClient.getTitle(currentChat.messages);
          dispatch(setTitle({ id: chatId, title }));
        } catch (error) {
          console.error('Failed to fetch title:', error);
        }
      }
    };
    fetchTitle();
  }, [chatId, chats, messages, dispatch]);

  return chatTitle;
};
