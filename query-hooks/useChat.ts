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
  selectHolisticTherapist,
  selectLibraryIntegrationEnabled,
} from "../redux/slices/chatSelectors";
import { selectPersonalData } from "../redux/slices/personalSlice";
import { selectCustomSystemPrompt } from "../redux/slices/systemPromptSlice";
import { ChatResponse, SystemPromptResponse } from "../model/ChatResponse";
import { CalendarService } from "../services/CalendarService";
import { Platform } from "react-native";
import { HealthService } from "../services/health";
import { RootState } from "../redux";
import StorageService from "../services/StorageService";
import type { StreamEvent } from "../apiClients/ChatApiClient";

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
  const libraryIntegrationEnabled = useSelector(selectLibraryIntegrationEnabled);
  const personalData = useSelector(selectPersonalData);
  const assistant_name = useSelector(
    (state: RootState) => state.chats.assistant_name
  );
  const customSystemPrompt = useSelector(selectCustomSystemPrompt);
  const persona = useSelector((state: RootState) => state.personal.persona);
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

  const buildCommonPayload = useCallback(
    async (
      messages: ApiChatMessage[],
      memory_keys: string[]
    ): Promise<{
      messagesWithDates: ApiChatMessage[];
      configurableData: string;
      memory_index: string[];
      memories: Record<string, string>;
      useCustomPrompt: boolean;
    }> => {
      const memories: Record<string, string> = {};
      for (let key of memory_keys ?? []) {
        if (!StorageService.keyIsValid(key)) continue;
        const value = await StorageService.get(key);
        if (value != null) memories[key] = value;
      }

      const configurableData =
        typeof personalData == "string"
          ? personalData
          : JSON.stringify(personalData);

      const memory_index = await StorageService.listKeys();

      const useCustomPrompt =
        messages.length > 0 &&
        messages[0].content.startsWith("/custom") &&
        !!customSystemPrompt;

      const messagesWithDates = messages.map((message) => ({
        ...message,
        timestamp:
          typeof message.timestamp == "number"
            ? new Date(message.timestamp as number)
            : message.timestamp,
      }));

      return {
        messagesWithDates,
        configurableData,
        memory_index,
        memories,
        useCustomPrompt,
      };
    },
    [personalData, customSystemPrompt]
  );

  const sendMessage = useCallback(
    async (
      messages: ApiChatMessage[],
      memory_keys: string[]
    ): Promise<ChatResponse> => {
      setIsLoading(true);
      setError(null);

      const {
        messagesWithDates,
        configurableData,
        memory_index,
        memories,
        useCustomPrompt,
      } = await buildCommonPayload(messages, memory_keys);

      try {
        const response = await ChatApiClient.sendMessage(
          model,
          humanPrompt,
          keepGoing,
          outsideBox,
          holisticTherapist,
          communicationStyle ?? ChatRequestCommunicationStyle.Default,
          messagesWithDates,
          configurableData,
          await staticData(),
          assistant_name,
          memory_index,
          memories,
          useCustomPrompt && customSystemPrompt
            ? customSystemPrompt
            : undefined,
          persona && persona.length > 0 ? persona : undefined,
          libraryIntegrationEnabled ?? false
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
      customSystemPrompt,
      persona,
      buildCommonPayload,
    ]
  );

  // Expose streaming generator for graceful migration
  const sendMessageStream = useCallback(
    async function* (
      messages: ApiChatMessage[],
      memory_keys: string[],
      signal?: AbortSignal
    ): AsyncGenerator<StreamEvent> {
      const {
        messagesWithDates,
        configurableData,
        memory_index,
        memories,
        useCustomPrompt,
      } = await buildCommonPayload(messages, memory_keys);

      for await (const evt of ChatApiClient.sendMessageStream(
        model,
        humanPrompt,
        keepGoing,
        outsideBox,
        holisticTherapist,
        communicationStyle ?? ChatRequestCommunicationStyle.Default,
        messagesWithDates,
        configurableData,
        await staticData(),
        assistant_name,
        memory_index,
        memories,
        useCustomPrompt && customSystemPrompt ? customSystemPrompt : undefined,
        persona && persona.length > 0 ? persona : undefined,
        libraryIntegrationEnabled ?? false,
        signal
      )) {
        yield evt;
      }
    },
    [
      model,
      humanPrompt,
      keepGoing,
      outsideBox,
      communicationStyle,
      buildCommonPayload,
      customSystemPrompt,
      persona,
      assistant_name,
    ]
  );

  return {
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    staticData,
  };
}

/**
 * Custom hook for generating personalized system prompts.
 * Handles the memory fetching loop by automatically requesting and providing
 * required memories until the system prompt is successfully generated.
 */
export function useSystemPrompt() {
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

  const generateSystemPrompt = useCallback(
    async (messages: ApiChatMessage[] = []): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        let memories: Record<string, string> = {};
        let configurableData =
          typeof personalData == "string"
            ? personalData
            : JSON.stringify(personalData);

        const memory_index = await StorageService.listKeys();
        let currentResponse: SystemPromptResponse;

        // Keep requesting until we get a system prompt (no more memory requests)
        do {
          currentResponse = await ChatApiClient.generateSystemPrompt(
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
            configurableData,
            await staticData(),
            assistant_name,
            memory_index,
            memories
          );

          // If memory is requested, fetch it and continue the loop
          if (currentResponse.requestForMemory?.keys) {
            for (let key of currentResponse.requestForMemory.keys) {
              // Validate key format (same as in useChat)
              if (!StorageService.keyIsValid(key)) {
                continue;
              }
              const value = await StorageService.get(key);
              if (value != null) {
                memories[key] = value;
              }
            }
          }
        } while (
          currentResponse.requestForMemory?.keys &&
          currentResponse.requestForMemory.keys.length > 0
        );

        if (!currentResponse.systemPrompt) {
          throw new Error("Failed to generate system prompt");
        }

        setError(null);
        return currentResponse.systemPrompt;
      } catch (err: any) {
        const error =
          err instanceof Error
            ? err
            : new Error((err as string) ?? "Failed to generate system prompt");
        console.log(error);
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
      holisticTherapist,
      communicationStyle,
      personalData,
      assistant_name,
    ]
  );

  return {
    generateSystemPrompt,
    isLoading,
    error,
  };
}
