import { ChatApiClient } from "../apiClients";
import {
  ApiChatMessage,
  ChatRequestCommunicationStyle,
} from "../model/ChatRequest";
import { useSelector } from "react-redux";
import { useState, useCallback, memo } from "react";
import {
  selectModel,
  selectHumanPrompt,
  selectKeepGoing,
  selectOutsideBox,
  selectCommunicationStyle,
  selectLanguage,
  selectHolisticTherapist,
} from "../redux/slices/chatSelectors";
import { selectPersonalData } from "../redux/slices/personalSlice";
import { ChatResponse } from "@/model";
import { CalendarService } from "@/services/CalendarService";
import { Platform } from "react-native";
import { HealthService } from "@/services/health";
import { RootState } from "@/redux";
import StorageService from "@/services/StorageService";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const holisticTherapist = useSelector(selectHolisticTherapist);
  const preferredLanguage = useSelector(selectLanguage);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const personalData = useSelector(selectPersonalData);
  const assistant_name = useSelector(
    (state: RootState) => state.chats.assistant_name
  );
  let staticData: () => Promise<any> = async () => {
    let sd: any = {
      preferredLanguage,
      date: new Date().toDateString() + " " + new Date().toTimeString(),
    };
    if (Platform.OS !== "web") {
      const upcomingEventsInCalendar =
        await CalendarService.getUpcomingEvents();
      const pastEventsInCalendar = await CalendarService.getPastWeekEvents();
      const health = await HealthService.getHealthDataSummerized();
      sd = {
        ...sd,
        upcomingEventsInCalendar,
        pastEventsInCalendar,
        health,
      };
    }
    return sd;
  };

  const sendMessage = useCallback(
    async (
      messages: ApiChatMessage[],
      memory_keys: string[]
    ): Promise<ChatResponse> => {
      setIsLoading(true);
      setError(null);

      const memories: Record<string, string> = {};
      for (let key of memory_keys ?? []) {
        // always llm quirks
        if (!StorageService.keyIsValid(key)) {
          continue;
        }
        var value = await StorageService.get(key);
        value != null && (memories[key] = value);
      }

      let configurableData =
        typeof personalData == "string"
          ? personalData
          : JSON.stringify(personalData);

      const memory_index = await StorageService.listKeys();

      try {
        const response = await ChatApiClient.sendMessage(
          model,
          humanPrompt,
          keepGoing,
          outsideBox,
          holisticTherapist,
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
          await staticData(),
          assistant_name,
          memory_index,
          memories
        );

        setError(null);
        return response;
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
    staticData
  };
}
