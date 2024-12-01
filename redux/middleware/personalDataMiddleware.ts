import { Middleware } from '@reduxjs/toolkit';
import { addMessage } from '../slices/chatsSlice';
import PersonalDataService from '../../services/PersonalDataService';

export const personalDataMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (addMessage.match(action)) {
    const message = action.payload.message;
    if (message.updateData) {
      PersonalDataService.getInstance().handleUpdateData(message.updateData);
    }
  }

  return result;
};
