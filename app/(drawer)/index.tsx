import { StyleSheet, View, SafeAreaView, Platform, Text } from "react-native";
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useChat } from "../../query-hooks/useChat";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectChatList, addMessage, addChat } from "../../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { ApiChatMessage } from "../../model/ChatRequest";
import { TextInput } from "react-native-gesture-handler";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const chats = useSelector(selectChatList);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');

  // Initialize chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      const newChatId = uuidv4();
      dispatch(addChat({
        id: newChatId,
        title: 'New Chat',
        messages: [],
      }));
      setCurrentChatId(newChatId);
    } else {
      setCurrentChatId(chats[0].id);
    }
  }, [chats.length]);

  // Convert API messages to GiftedChat format
  useEffect(() => {
    const currentChat = chats.find(chat => chat.id === currentChatId);
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
  }, [currentChatId, chats]);

  useEffect(() => {
    console.log('Current Chat ID:', currentChatId);
    console.log('Messages:', messages);
  }, [currentChatId, messages]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    
    // Add user message to Redux
    const apiUserMessage: ApiChatMessage = {
      role: 'user',
      content: userMessage.text
    };
    dispatch(addMessage({ id: currentChatId, message: apiUserMessage }));

    try {
      // Send message to API
      const response = await sendMessage([apiUserMessage]);
      
      // Add assistant response to Redux
      const apiAssistantMessage: ApiChatMessage = {
        role: 'assistant',
        content: response
      };
      dispatch(addMessage({ id: currentChatId, message: apiAssistantMessage }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [currentChatId, sendMessage]);

  return (
    <SafeAreaView style={styles.container}>
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
          bottomOffset={Platform.select({ ios: 200, android: 100 })} // Increased bottomOffset
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.select({ ios: 100, android: 50 }), // Added paddingBottom
  },
});