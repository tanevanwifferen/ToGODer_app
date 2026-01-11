import { useMemo } from 'react';
import { IMessage } from 'react-native-gifted-chat';
import { ApiChatMessage } from '../model/ChatRequest';

/**
 * Converts an API chat message to Gifted Chat format
 */
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

/**
 * Hook for converting API messages to Gifted Chat messages format.
 * Handles the conversion and reversal needed for the inverted chat display.
 */
export const useGiftedMessages = (apiMessages: ApiChatMessage[] | null) => {
  const giftedMessages = useMemo(() => {
    if (apiMessages == null) {
      return [];
    }
    return [...apiMessages]
      .filter((msg) => !msg.hidden)
      .map(convertToGiftedMessage)
      .reverse();
  }, [apiMessages]);

  return giftedMessages;
};
