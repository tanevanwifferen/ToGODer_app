import { ChatApiClient } from "@/apiClients";
import { ApiChatMessage, ChatRequestCommunicationStyle } from "@/model";
import { selectModel } from "@/redux";
import { useState, useCallback } from "react";
import { useSelector } from "react-redux";

interface Message {
  sender: "user" | "bot";
  content: string;
}

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const model = useSelector(selectModel);

  const sendMessage = useCallback(
    async (messages: ApiChatMessage[]): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ChatApiClient.sendMessage(
          model,
          false,
          false,
          false,
          ChatRequestCommunicationStyle.Default,
          [{ role: "user", content: "hallo" }]
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
    []
  );

  return {
    sendMessage,
    isLoading,
    error,
  };
}
