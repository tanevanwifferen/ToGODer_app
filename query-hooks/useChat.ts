import { ChatApiClient } from "../apiClients";
import { ApiChatMessage, ChatRequestCommunicationStyle } from "../model/ChatRequest";
import { useSelector } from "react-redux";
import { useState, useCallback } from "react";
import { selectModel, selectHumanPrompt, selectKeepGoing, selectOutsideBox, selectCommunicationStyle } from "@/redux/slices/chatSelectors";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const communicationStyle = useSelector(selectCommunicationStyle);

  const sendMessage = useCallback(
    async (messages: ApiChatMessage[]): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ChatApiClient.sendMessage(
          model,
          humanPrompt,
          keepGoing,
          outsideBox,
          communicationStyle ?? ChatRequestCommunicationStyle.Default,
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
    [model, humanPrompt, keepGoing, outsideBox, communicationStyle]
  );

  return {
    sendMessage,
    isLoading,
    error,
  };
}
