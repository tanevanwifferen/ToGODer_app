import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectPrompts } from '../redux/slices/globalConfigSlice';
import { IMessage } from 'react-native-gifted-chat';

export const usePrompts = (messages: IMessage[]) => {
  const [showPrompts, setShowPrompts] = useState(false);
  const [inputText, setInputText] = useState('');
  const prompts = useSelector(selectPrompts);

  const handleInputTextChanged = (text: string) => {
    setInputText(text);
    if (text.startsWith('/') && !text.includes(' ') && messages.length == 0) {
      setShowPrompts(true);
    } else {
      setShowPrompts(false);
    }
  };

  const handleSelectPrompt = (promptKey: string) => {
    setInputText(promptKey);
    setShowPrompts(false);
  };

  const filteredPrompts = showPrompts
    ? Object.entries(prompts).filter(([key]) => key.includes(inputText))
    : [];

  return {
    showPrompts,
    inputText,
    filteredPrompts,
    handleInputTextChanged,
    handleSelectPrompt
  };
};
