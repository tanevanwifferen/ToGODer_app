import React, { useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  useColorScheme,
} from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { Colors } from "../constants/Colors";
import { ChatHeader } from "./chat/ChatHeader";
import { CustomInputToolbar } from "./chat/CustomInputToolbar";
import { EmptyChat } from "./chat/EmptyChat";
import { useMessages } from "../hooks/useMessages";
import { useChatTitle } from "../hooks/useChatTitle";
import { usePrompts } from "../hooks/usePrompts";
import { useChatInput } from "../hooks/useChatInput";
import { useChatActions } from "../hooks/useChatActions";
import { ApiChatMessage } from "../model/ChatRequest";
import Toast from "react-native-toast-message";
import { ThemedText } from "./ThemedText";
import { useExperienceContext } from "./providers/ExperienceProvider";

interface ChatProps {
  chatId: string;
  onBack: () => void;
}

const convertToGiftedMessage = (
  msg: ApiChatMessage,
  index: number
): IMessage => ({
  _id: index.toString(),
  text: msg.content,
  createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
  user: {
    _id: msg.role === "user" ? 1 : 2,
    name: msg.role === "user" ? "User" : "Assistant",
  },
});

export function Chat({ chatId, onBack }: ChatProps) {
  const colorScheme = useColorScheme();
  const { showLanguageInput } = useExperienceContext();
  const {
    messages: apiMessages,
    onSend: sendApiMessage,
    onDeleteMessage,
    errorMessage,
    retrySend,
    typing
  } = useMessages(chatId);

  // Check language configuration when chat component mounts or becomes active
  useEffect(() => {
    showLanguageInput();
  }, [showLanguageInput]);

  // Convert API messages to Gifted Chat messages
  const giftedMessages = useMemo(() => {
    if(apiMessages == null){
      return [];
    }
    return [...apiMessages].map(convertToGiftedMessage).reverse();
  }, [apiMessages]);

  const chatTitle = useChatTitle(chatId, giftedMessages);
  
  // Get persistent chat input state from Redux
  const { inputText, setInputText } = useChatInput(chatId);
  
  const {
    showPrompts,
    filteredPrompts,
    handleInputTextChanged,
    handleSelectPrompt
  } = usePrompts(giftedMessages, inputText, setInputText);
  const { onLongPress } = useChatActions(
    giftedMessages,
    (messageId: string) => {
      const messageIndex = giftedMessages.findIndex(
        (msg) => msg._id === messageId
      );
      if (messageIndex !== -1 && apiMessages != null) {
        // Convert from reversed index to original index
        onDeleteMessage(apiMessages.length - 1 - messageIndex);
      }
    }
  );

  const renderInputToolbar = (toolbarProps: any) => (
    <CustomInputToolbar
      {...toolbarProps}
      onSend={(messages: IMessage[]) => {
        if (messages[0]) {
          sendApiMessage(messages[0].text);
          setInputText("");
        }
      }}
      showPrompts={showPrompts}
      inputText={inputText}
      filteredPrompts={filteredPrompts}
      onInputTextChanged={handleInputTextChanged}
      onSelectPrompt={handleSelectPrompt}
    />
  );

  const renderSystemMessage = () => {
    if (errorMessage) return <ThemedText>{errorMessage}</ThemedText>;
    return null;
  };

  const backgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ChatHeader
        title={chatTitle}
        onBack={onBack}
        messages={apiMessages ?? []}
      />
      <View style={[styles.chatContainer, { backgroundColor }]}>
        <GiftedChat
          messages={giftedMessages}
          onSend={(messages) => {
            if (messages[0]) {
              sendApiMessage(messages[0].text);
              setInputText("");
            }
          }}
          user={{
            _id: 1,
          }}
          text={inputText}
          renderChatEmpty={() => (
            <EmptyChat setInputText={setInputText} />
          )}
          renderInputToolbar={renderInputToolbar}
          renderAvatar={null}
          alwaysShowSend
          scrollToBottom
          maxComposerHeight={200}
          minComposerHeight={60}
          inverted={true}
          isTyping={typing}
          minInputToolbarHeight={0}
          onLongPress={onLongPress}
          renderSystemMessage={renderSystemMessage}
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
