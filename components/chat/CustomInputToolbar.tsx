import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  InputToolbar,
  InputToolbarProps,
  Composer,
  IMessage,
  SendProps,
  Send,
} from "react-native-gifted-chat";
import { PromptSuggestions } from "./PromptSuggestions";
import { Ionicons } from "@expo/vector-icons";

interface CustomInputToolbarProps extends InputToolbarProps<IMessage> {
  showPrompts: boolean;
  inputText: string;
  filteredPrompts: [string, { description: string }][];
  onInputTextChanged: (text: string) => void;
  onSelectPrompt: (key: string) => void;
  onSend: (messages: {text:string}[]) => void;
}


export function CustomInputToolbar({
  showPrompts,
  inputText,
  filteredPrompts,
  onInputTextChanged,
  onSelectPrompt,
  onSend,
  ...toolbarProps
}: CustomInputToolbarProps) {

  function handleSend(){
    onSend([{text: inputText}]);
    onInputTextChanged("");
  }

  const renderComposer = (composerProps: any) => (
    <Composer
      {...composerProps}
      text={inputText}
      onTextChanged={onInputTextChanged}
      textInputProps={{
        autoCorrect: true,
        autoCapitalize: "sentences",
        spellCheck: true,
        autoComplete: "on",
        blurOnSubmit: Platform.OS === "web",
        onSubmitEditing:
          Platform.OS === "web"
            ? () => {
                if (inputText) {
                  handleSend();
                }
              }
            : undefined,
      }}
    />
  );

  const renderSend = (props: SendProps<IMessage>, onSend: any, inputText: string) => {
    return (
      <Send
        {...props}
        onSend={handleSend}
        containerStyle={styles.sendContainer}
        disabled={!props.text}
      >
        <View style={[styles.sendButton, !props.text && styles.sendButtonDisabled]}>
          <Ionicons 
            name="send" 
            size={24} 
            color={props.text ? "#007AFF" : "#B8B8B8"}
          />
        </View>
      </Send>
    );
  };

  return (
    <View>
      {showPrompts && (
        <PromptSuggestions
          prompts={filteredPrompts}
          onSelectPrompt={onSelectPrompt}
        />
      )}
      <InputToolbar
        {...toolbarProps}
        containerStyle={styles.inputToolbar}
        renderComposer={renderComposer}
        renderSend={(props)=>renderSend(props, onSend, inputText)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  }
});
