import { ChatApiClient } from "../apiClients";
import { ApiChatMessage } from "../model/ChatRequest";
import { useSelector } from "react-redux";
import { useState, useCallback } from "react";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get all required settings from the chats state
  const settings = useSelector((state: any) => ({
    model: state.chats.model,
    humanPrompt: state.chats.humanPrompt,
    keepGoing: state.chats.keepGoing,
    outsideBox: state.chats.outsideBox,
    communicationStyle: state.chats.communicationStyle,
  }));

  const sendMessage = useCallback(
    async (messages: ApiChatMessage[]): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ChatApiClient.sendMessage(
          settings.model,
          settings.humanPrompt,
          settings.keepGoing,
          settings.outsideBox,
          settings.communicationStyle,
          messages
        );

        return response.content ?? "";
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [settings]
  );

  return {
    sendMessage,
    isLoading,
    error,
  };
}
