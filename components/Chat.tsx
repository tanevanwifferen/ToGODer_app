import React from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  useColorScheme,
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { Colors } from "../constants/Colors";
import { ChatHeader } from "./chat/ChatHeader";
import { CustomInputToolbar } from "./chat/CustomInputToolbar";
import { EmptyChat } from "./chat/EmptyChat";
import { useMessages } from "../hooks/useMessages";
import { useChatTitle } from "../hooks/useChatTitle";
import { usePrompts } from "../hooks/usePrompts";
import { useChatActions } from "../hooks/useChatActions";
import Toast from "react-native-toast-message";

interface ChatProps {
  chatId: string;
  onBack: () => void;
}

export function Chat({ chatId, onBack }: ChatProps) {
  const colorScheme = useColorScheme();
  const { messages, onSend, onDeleteMessage } = useMessages(chatId);
  const chatTitle = useChatTitle(chatId, messages);
  const {
    showPrompts,
    inputText,
    filteredPrompts,
    handleInputTextChanged,
    handleSelectPrompt,
  } = usePrompts(messages);
  const { onLongPress } = useChatActions(messages, onDeleteMessage);

  const renderInputToolbar = (toolbarProps: any) => (
    <CustomInputToolbar
      {...toolbarProps}
      onSend={onSend}
      showPrompts={showPrompts}
      inputText={inputText}
      filteredPrompts={filteredPrompts}
      onInputTextChanged={handleInputTextChanged}
      onSelectPrompt={handleSelectPrompt}
    />
  );

  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ChatHeader title={chatTitle} onBack={onBack} />
      <View style={[styles.chatContainer, { backgroundColor }]}>
          <GiftedChat
            messages={messages}
            onSend={(messages) => {
              console.log("onsend", messages);
              onSend(messages);
              handleInputTextChanged("");
            }}
            user={{
              _id: 1,
            }}
            text={inputText}
            renderChatEmpty={() => <EmptyChat />}
            renderInputToolbar={renderInputToolbar}
            renderAvatar={null}
            alwaysShowSend
            scrollToBottom
            maxComposerHeight={200}
            minComposerHeight={60}
            inverted={true}
            minInputToolbarHeight={0}
            onLongPress={onLongPress}
          />
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    paddingBottom: Platform.select({ ios: 0, android: 0 }),
  },
});
