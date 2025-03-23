/**
 * Hook for managing the language input experience.
 * Centralizes all language input modal visibility logic and handles language submission.
 */
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, updateSettings } from '../redux/slices/chatsSlice';
import { selectCurrentChat } from '../redux/slices/chatSelectors';
import { setModalVisible } from '../redux/slices/experienceSlice';
import { ExperienceApiClient } from '../apiClients/ExperienceApiClient';
import { selectPersonalData } from '../redux/slices/personalSlice';
import { LanguageInputModal } from '../components/experience/LanguageInputModal';
import { useRoute } from '../components/providers/RouteProvider';
import { usePathname } from 'expo-router';
import { RouteService } from '../services/RouteService';

export const useExperience = () => {
  const dispatch = useDispatch();
  const selectedChat = useSelector(selectCurrentChat);
  const personalData = useSelector(selectPersonalData);
  const { isSharedRoute } = useRoute();
  const pathname = usePathname();
  
  // Get language from state
  const language = useSelector((state: any) => state.chats.language);
  const hasLanguageConfigured = language !== '' && language != null;

  // TODO: add calendar / health
  // TODO: group all that stuff into one service so we don't have to call all those
  // services every time we want to send them to the backend.

  const handleSubmit = async (lang: string) => {
    dispatch(setModalVisible(false));
    dispatch(updateSettings({language:lang}));
    
    try {
      const response = await ExperienceApiClient.getExperience({
        language: lang,
        data: personalData
      });
      
      if (selectedChat) {
        dispatch(addMessage({
          id: selectedChat.id,
          message: {
            role: 'assistant',
            content: response.content,
          }
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  /**
   * Centralized function to show the language input modal.
   * Shows the modal only if:
   * 1. We're not on a shared route
   * 2. Language is not already configured (unless forceShow is true)
   * 3. We're on the chat route (root)
   *
   * @param forceShow If true, shows the modal even if language is already configured
   */
  const showLanguageInput = (forceShow = false) => {
    // Check if we're at the chat route (root)
    const isChatRoute = pathname === '/' || pathname === '/index';
    const currentRoute = RouteService.getCurrentRoute();
    const isRouteServiceChatRoute = currentRoute === '/' || currentRoute === '/index';
    
    // Only show language input if:
    // 1. Not on a shared route
    // 2. Language isn't configured OR forceShow is true
    // 3. We're on the chat route
    if (!isSharedRoute && (forceShow || !hasLanguageConfigured) && (isChatRoute || isRouteServiceChatRoute)) {
      dispatch(setModalVisible(true));
    }
  };

  return {
    showLanguageInput,
    LanguageInputModal: () => (
      <LanguageInputModal
        onSubmit={handleSubmit}
      />
    ),
  };
};
