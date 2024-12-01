import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InputToolbar, InputToolbarProps, Composer, IMessage } from 'react-native-gifted-chat';
import { PromptSuggestions } from './PromptSuggestions';

interface CustomInputToolbarProps extends InputToolbarProps<IMessage> {
  showPrompts: boolean;
  inputText: string;
  filteredPrompts: [string, { description: string }][];
  onInputTextChanged: (text: string) => void;
  onSelectPrompt: (key: string) => void;
}

export function CustomInputToolbar({
  showPrompts,
  inputText,
  filteredPrompts,
  onInputTextChanged,
  onSelectPrompt,
  ...toolbarProps
}: CustomInputToolbarProps) {
  const renderComposer = (composerProps: any) => (
    <Composer
      {...composerProps}
      text={inputText}
      onTextChanged={onInputTextChanged}
      placeholder='Type / to see possible commands'
      textInputProps={{
        autoCorrect: true,
        autoCapitalize: 'sentences',
        spellCheck: true,
        autoComplete: 'on',
      }}
    />
  );

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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
});
