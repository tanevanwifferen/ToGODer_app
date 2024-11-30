import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addChat, addMessage, setCurrentChat } from '../redux/slices/chatsSlice';
import { ExperienceApiClient } from '../apiClients/ExperienceApiClient';
import { v4 as uuidv4 } from 'uuid';

export const useExperience = () => {
  const dispatch = useDispatch();

  const showLanguageSelector = () => {
    Alert.alert(
      'Select Language',
      'Which language would you like to use?',
      [
        {
          text: 'English',
          onPress: () => handleLanguageSelection('english'),
        },
        {
          text: 'Dutch',
          onPress: () => handleLanguageSelection('dutch'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleLanguageSelection = async (language: string) => {
    try {
      const response = await ExperienceApiClient.getExperience({ language });
      
      // Create a new chat
      const chatId = uuidv4();
      dispatch(addChat({
        id: chatId,
        messages: [],
      }));

      // Add the experience message to the chat
      dispatch(addMessage({
        id: chatId,
        message: {
          role: 'assistant',
          content: response.content,
        },
      }));

      dispatch(setCurrentChat(chatId));

      return chatId;
    } catch (error) {
      Alert.alert('Error', 'Failed to get experience. Please try again.');
      console.error('Experience error:', error);
    }
  };

  return {
    showLanguageSelector,
  };
};
