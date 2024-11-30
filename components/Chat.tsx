import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { ChatHeader } from './chat/ChatHeader';
import { CustomInputToolbar } from './chat/CustomInputToolbar';
import { EmptyChat } from './chat/EmptyChat';
import { useMessages } from '../hooks/useMessages';
import { useChatTitle } from '../hooks/useChatTitle';
import { usePrompts } from '../hooks/usePrompts';

interface ChatProps {
  chatId: string;
  onBack: () => void;
}

export function Chat({ chatId, onBack }: ChatProps) {
  const { messages, onSend } = useMessages(chatId);
  const chatTitle = useChatTitle(chatId, messages);
  const {
    showPrompts,
    inputText,
    filteredPrompts,
    handleInputTextChanged,
    handleSelectPrompt
  } = usePrompts(messages);

  const renderInputToolbar = (toolbarProps: any) => (
    <CustomInputToolbar
      {...toolbarProps}
      showPrompts={showPrompts}
      inputText={inputText}
      filteredPrompts={filteredPrompts}
      onInputTextChanged={handleInputTextChanged}
      onSelectPrompt={handleSelectPrompt}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader title={chatTitle} onBack={onBack} />
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: 1,
          }}
          text={inputText}
          renderChatEmpty={() => <EmptyChat />}
          renderInputToolbar={renderInputToolbar}
          renderAvatar={null}
          alwaysShowSend
          scrollToBottom
          inverted={true}
          minInputToolbarHeight={0}
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
    paddingBottom: Platform.select({ ios: 0, android: 0 }),
  },
});
