import { useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { ChatApiClient } from "../apiClients/ChatApiClient";
import { ApiChatMessage } from "../model/ChatRequest";
import StorageService from "../services/StorageService";
import { addMessage, deleteMessageByContent } from "../redux/slices/chatsSlice";

/**
 * Hook for handling asynchronous memory updates.
 * Updates are processed independently of the chat flow.
 */
export const useMemoryUpdates = (chatId: string) => {
  const dispatch = useDispatch();
  const pendingMemoryUpdate = useRef<boolean>(false);

  const updateMemory = useCallback((
    model: string,
    messages: ApiChatMessage[],
    memories: string[],
    assistant_name?: string
  ) => {
    if (pendingMemoryUpdate.current) return;
    pendingMemoryUpdate.current = true;

    // Get memories asynchronously
    const getMemories = async () => {
      const memoryData: Record<string, string> = {};
      for (let key of memories) {
        if (!StorageService.keyIsValid(key)) continue;
        const value = await StorageService.get(key);
        if (value != null) memoryData[key] = value;
      }
      return memoryData;
    };

    // Process memory update without blocking
    getMemories().then(memoryData => {
      StorageService.listKeys().then(memoryIndex => {
        ChatApiClient.updateMemory(
          model,
          messages,
          undefined,
          undefined,
          assistant_name,
          memoryIndex,
          memoryData
        ).then(response => {
          if ('content' in response && response.updateData) {
            const userMessage = messages[messages.length - 1];
            dispatch(deleteMessageByContent({ chatId, content: userMessage.content }));
            dispatch(addMessage({
              id: chatId,
              message: { ...userMessage, updateData: response.updateData }
            }));
          }
        }).catch(error => {
          console.error('Memory update failed:', error);
        }).finally(() => {
          pendingMemoryUpdate.current = false;
        });
      });
    });
  }, [chatId, dispatch]);

  return { updateMemory };
};