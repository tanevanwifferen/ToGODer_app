import { useState, useEffect, useCallback } from 'react';
import { IMessage } from 'react-native-gifted-chat';
import { useSelector, useDispatch } from 'react-redux';
import { selectChatList, addMessage, deleteMessage } from '../redux/slices/chatsSlice';
import { useChat } from '../query-hooks/useChat';
import { ApiChatMessage } from '../model/ChatRequest';
import { BalanceService } from '../services/BalanceService';

export const useMessages = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const chats = useSelector(selectChatList);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const balanceService = BalanceService.getInstance();

  useEffect(() => {
    const currentChat = chats.find(chat => chat.id === chatId);
    if (currentChat) {
      const giftedMessages: IMessage[] = currentChat.messages.map((msg: ApiChatMessage, index: number) => ({
        _id: index.toString(),
        text: msg.content,
        createdAt: new Date(),
        user: {
          _id: msg.role === 'user' ? 1 : 2,
          name: msg.role === 'user' ? 'User' : 'Assistant'
        }
      })).reverse();
      setMessages(giftedMessages);
    }
  }, [chatId, chats]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    const currentChat = chats.find(chat => chat.id === chatId);
    
    if (!currentChat) return;
    
    const apiUserMessage: ApiChatMessage = {
      role: 'user',
      content: userMessage.text
    };
    dispatch(addMessage({ id: chatId, message: apiUserMessage }));

    try {
      const completeHistory: ApiChatMessage[] = [
        ...currentChat.messages,
        apiUserMessage
      ];

      const response = await sendMessage(completeHistory);
      
      const apiAssistantMessage: ApiChatMessage = {
        role: 'assistant',
        content: response
      };
      dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));

      // Update balance after receiving response
      await balanceService.updateBalanceIfAuthenticated();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [chatId, sendMessage, dispatch, chats]);

  const onDeleteMessage = useCallback((messageId: any) => {
    const messageIndex = messages.reverse().findIndex(x => x._id == messageId); // Convert from reversed index to original index
    dispatch(deleteMessage({ chatId, messageIndex }));
  }, [chatId, dispatch, messages.length]);

  return {
    messages,
    onSend,
    onDeleteMessage
  };
};
