import { ChatApiClient } from "../apiClients";
import {
  ApiChatMessage,
  ChatRequestCommunicationStyle,
} from "../model/ChatRequest";
import { useSelector } from "react-redux";
import { useState, useCallback } from "react";
import {
  selectModel,
  selectHumanPrompt,
  selectKeepGoing,
  selectOutsideBox,
  selectCommunicationStyle,
  selectLanguage,
} from "../redux/slices/chatSelectors";
import { selectPersonalData } from "../redux/slices/personalSlice";
import { ChatResponse } from "@/model";
import { CalendarService } from "@/services/CalendarService";
import { Platform } from "react-native";
import { HealthService } from "@/services/health";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const preferredLanguage = useSelector(selectLanguage);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const personalData = useSelector(selectPersonalData);
  const assistant_name = useSelector((state: RootState) => state.chats.assistant_name);

  const sendMessage = useCallback(
    async (messages: ApiChatMessage[]): Promise<ChatResponse> => {
      setIsLoading(true);
      setError(null);

      let configurableData =
        typeof personalData == "string"
          ? personalData
          : JSON.parse(personalData);
      let staticData:any = {preferredLanguage};
      if (Platform.OS !== "web") {
        const calendar = await CalendarService.getUpcomingEvents();
        const health = await HealthService.getHealthDataSummerized();
        staticData = {...staticData, calendar, health };
      }

      try {
        const response = await ChatApiClient.sendMessage(
          model,
          humanPrompt,
          keepGoing,
          outsideBox,
          communicationStyle ?? ChatRequestCommunicationStyle.Default,
          messages.map((message) => ({
            ...message,
            timestamp:
              typeof message.timestamp == "number"
                ? new Date(message.timestamp as number)
                : message.timestamp,
          })),
          // legacy of dev
          configurableData,
          staticData,
          assistant_name
        );

        return { ...response, content: response.content ?? "" };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      model,
      humanPrompt,
      keepGoing,
      outsideBox,
      communicationStyle,
      personalData,
    ]
  );

  return {
    sendMessage,
    isLoading,
    error,
  };
}
