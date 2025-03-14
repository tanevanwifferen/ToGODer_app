import { useDispatch, useSelector } from 'react-redux';
import { addMessage, updateSettings } from '../redux/slices/chatsSlice';
import { selectCurrentChat, selectLanguage } from '../redux/slices/chatSelectors';
import { setModalVisible } from '../redux/slices/experienceSlice';
import { ExperienceApiClient } from '../apiClients/ExperienceApiClient';
import { selectPersonalData } from '../redux/slices/personalSlice';
import { LanguageInputModal } from '../components/experience/LanguageInputModal';
import { useRoute } from '../components/providers/RouteProvider';

export const useExperience = () => {
  const dispatch = useDispatch();
  const selectedChat = useSelector(selectCurrentChat);
  const personalData = useSelector(selectPersonalData);

  // TODO: add calendar / health
  // TODO: group all that stuff into one service so we don't have to call all those
  // services every time we want to send them to the backend.

  const handleSubmit = async (language: string) => {
    dispatch(setModalVisible(false));
    // Store language in chatSlice
    dispatch(updateSettings({ language }));
    
    try {
      const response = await ExperienceApiClient.getExperience({ 
        language,
        data: personalData
      });
      dispatch(addMessage({
        id: selectedChat!.id,
        message: {
          role: 'assistant',
          content: response.content,
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const language = useSelector(selectLanguage);
  const { isSharedRoute } = useRoute();
  const hasLanguageConfigured = !!language;

  return {
    showLanguageInput: () => {
      // Show language input if we're in a chat (selected chat exists) and language isn't configured,
      // regardless of whether we came from a shared route
      if (selectedChat && !hasLanguageConfigured) {
        dispatch(setModalVisible(true));
      }
    },
    LanguageInputModal: () => (
      <LanguageInputModal
        onSubmit={handleSubmit}
      />
    ),
  };
};
