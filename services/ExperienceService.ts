/**
 * Service for managing experience-related functionality outside of React components.
 * Provides a bridge between non-React services and the React-based experience features.
 */

import { store } from '../redux/store';
import { setModalVisible } from '../redux/slices/experienceSlice';
import { RouteService } from './RouteService';

export class ExperienceService {
  /**
   * Shows the language input modal if needed based on current app state.
   * This is a non-React version of the showLanguageInput function in useExperience.
   */
  static showLanguageInputIfNeeded() {
    const state = store.getState();
    
    // Check if we're at the chat route (root)
    const currentRoute = RouteService.getCurrentRoute();
    const isChatRoute = currentRoute === '/' || currentRoute === '/index';
    
    // Check if we're on a shared route
    const isSharedRoute = RouteService.isSharedRoute();
    
    // Check if language is configured
    const language = state.chats.language;
    const hasLanguageConfigured = language !== '' && language != null;
    
    // Only show language input if:
    // 1. Not on a shared route
    // 2. Language isn't configured
    // 3. We're on the chat route
    if (!isSharedRoute && !hasLanguageConfigured && isChatRoute) {
      store.dispatch(setModalVisible(true));
    }
  }
}