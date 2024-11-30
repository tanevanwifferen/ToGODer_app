import { StyleSheet, View, SafeAreaView, Platform, TouchableOpacity, Text } from "react-native";
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useChat } from "../query-hooks/useChat";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectChatList, addMessage, setTitle, selectChatById } from "../redux/slices/chatsSlice";
import { ApiChatMessage } from "../model/ChatRequest";
import { ChatApiClient } from "../apiClients/ChatApiClient";

interface ChatProps {
  chatId: string;
  onBack: () => void;
}

export function Chat({ chatId, onBack }: ChatProps) {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const chats = useSelector(selectChatList);
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Convert API messages to GiftedChat format
  useEffect(() => {
    const currentChat = chats.find(chat => chat.id === chatId);
    if (currentChat) {
      const giftedMessages: IMessage[] = currentChat.messages.map((msg: ApiChatMessage) => ({
        _id: Math.random().toString(),
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

  const currentChat = useSelector(state => selectChatById(state, chatId));
  const chatTitle = currentChat ? currentChat.title : 'Chat';

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    const currentChat = chats.find(chat => chat.id === chatId);
    
    if (!currentChat) return;
    
    // Add user message to Redux
    const apiUserMessage: ApiChatMessage = {
      role: 'user',
      content: userMessage.text
    };
    dispatch(addMessage({ id: chatId, message: apiUserMessage }));

    try {
      // Create the complete message history
      const completeHistory: ApiChatMessage[] = [
        ...currentChat.messages,
        apiUserMessage
      ];

      // Send complete history to API
      const response = await sendMessage(completeHistory);
      
      // Add assistant response to Redux
      const apiAssistantMessage: ApiChatMessage = {
        role: 'assistant',
        content: response
      };
      dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [chatId, sendMessage, chats]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{chatTitle}</Text>
        </View>
      </View>
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: 1,
          }}
          renderAvatar={null}
          alwaysShowSend
          scrollToBottom
          inverted={true}
          minInputToolbarHeight={50}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    minWidth: 60, // Ensure minimum width for back button
  },
  backButtonText: {
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.select({ ios: 0, android: 0 }),
  },
});
