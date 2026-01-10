import { useState, useCallback, useRef } from "react";
import { ApiChatMessage } from "../model/ChatRequest";
import { ChatResponse, MessageResponse } from "../model/ChatResponse";
import type { StreamEvent } from "../apiClients/ChatApiClient";

export interface SendMessageOptions {
  memoryLoopCount?: number;
  memoryLoopLimitReached?: boolean;
}

export interface MessageSendingApi {
  sendMessage: (
    messages: ApiChatMessage[],
    memories: Record<string, string>,
    options?: SendMessageOptions
  ) => Promise<ChatResponse>;
  sendMessageStream?: (
    messages: ApiChatMessage[],
    memories: Record<string, string>,
    options?: SendMessageOptions,
    signal?: AbortSignal
  ) => AsyncGenerator<StreamEvent>;
}

export interface MessageSendingCallbacks {
  onChunk?: (accumulated: string) => void;
  onSignature?: (signature: string) => void;
  onMemoryRequest?: (keys: string[]) => void;
  onComplete?: (response: MessageResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseMessageSendingResult {
  sendMessage: (
    messages: ApiChatMessage[],
    memories: Record<string, string>,
    options?: SendMessageOptions
  ) => Promise<MessageResponse | null>;
  retry: () => Promise<MessageResponse | null>;
  cancel: () => void;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

/**
 * Hook for handling message sending with streaming support, error handling, and retry logic.
 * Decoupled from Redux for testability.
 */
export function useMessageSending(
  api: MessageSendingApi,
  callbacks?: MessageSendingCallbacks
): UseMessageSendingResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Store last request for retry
  const lastRequestRef = useRef<{
    messages: ApiChatMessage[];
    memories: Record<string, string>;
    options?: SendMessageOptions;
  } | null>(null);

  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (
      messages: ApiChatMessage[],
      memories: Record<string, string>,
      options?: SendMessageOptions
    ): Promise<MessageResponse | null> => {
      // Store for retry
      lastRequestRef.current = { messages, memories, options };

      setIsLoading(true);
      setError(null);

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      let accumulated = "";
      let signature: string | undefined;
      let usedStreaming = false;
      let receivedStreamError = false;

      try {
        // Try streaming first if available
        if (api.sendMessageStream) {
          try {
            const stream = api.sendMessageStream(messages, memories, options, signal);

            for await (const evt of stream) {
              if (signal.aborted) {
                throw new Error("Request cancelled");
              }

              switch (evt.type) {
                case "chunk": {
                  usedStreaming = true;
                  const chunk = typeof evt.data === "string" ? evt.data : "";
                  accumulated += chunk;
                  callbacks?.onChunk?.(accumulated);
                  break;
                }
                case "signature": {
                  signature = evt.data;
                  callbacks?.onSignature?.(evt.data);
                  break;
                }
                case "memory_request": {
                  const keys = evt.data?.keys ?? [];
                  callbacks?.onMemoryRequest?.(keys);
                  // Return null to signal memory request - caller handles the loop
                  setIsLoading(false);
                  return null;
                }
                case "error": {
                  receivedStreamError = true;
                  const errorMsg =
                    typeof evt.data === "string"
                      ? evt.data
                      : evt.data?.message ?? "Streaming error occurred";
                  throw new Error(errorMsg);
                }
                case "done": {
                  // Stream complete
                  break;
                }
              }
            }
          } catch (streamErr) {
            // If streaming received an error event or we got chunk data, don't fallback
            if (receivedStreamError || (usedStreaming && accumulated.length > 0)) {
              throw streamErr;
            }
            // Otherwise try non-streaming fallback
            usedStreaming = false;
          }
        }

        // Non-streaming fallback
        if (!usedStreaming) {
          const response = await api.sendMessage(messages, memories, options);

          if ("requestForMemory" in response) {
            // Memory request response
            const keys = (response as any).requestForMemory?.keys ??
                        (Array.isArray((response as any).requestForMemory)
                          ? (response as any).requestForMemory
                          : []);
            callbacks?.onMemoryRequest?.(keys);
            setIsLoading(false);
            return null;
          }

          // Content response
          const messageResponse = response as MessageResponse;
          accumulated = messageResponse.content;
          signature = messageResponse.signature;
          callbacks?.onChunk?.(accumulated);
          if (signature) {
            callbacks?.onSignature?.(signature);
          }
        }

        const result: MessageResponse = {
          content: accumulated,
          signature,
        };

        callbacks?.onComplete?.(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        callbacks?.onError?.(error);
        setIsLoading(false);
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [api, callbacks]
  );

  const retry = useCallback(async (): Promise<MessageResponse | null> => {
    if (!lastRequestRef.current) {
      const err = new Error("No previous request to retry");
      setError(err);
      return null;
    }

    const { messages, memories, options } = lastRequestRef.current;
    return sendMessage(messages, memories, options);
  }, [sendMessage]);

  return {
    sendMessage,
    retry,
    cancel,
    isLoading,
    error,
    clearError,
  };
}
