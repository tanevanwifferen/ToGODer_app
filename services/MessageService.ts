import { store } from "../redux/store";
import {
  addChat,
  addMessage,
  updateMessageAtIndex,
  addMemories,
  setAutoGenerateAnswer,
} from "../redux/slices/chatsSlice";
import { ChatApiClient, StreamEvent } from "../apiClients/ChatApiClient";
import { ApiChatMessage } from "../model/ChatRequest";
import Toast from "react-native-toast-message";
import { BalanceService } from "./BalanceService";
import StorageService from "./StorageService";

const MAX_MEMORY_FETCH_LOOPS = 4;

export interface SendMessageOptions {
  chatId: string;
  content: string;
  useStreaming?: boolean;
  memoryLoopCount?: number;
  memoryLoopLimitReached?: boolean;
  onChunk?: (content: string) => void;
  onComplete?: (message: ApiChatMessage) => void;
  onError?: (error: string) => void;
}

export interface SendMessageStreamOptions {
  chatId: string;
  messages: ApiChatMessage[];
  memories: string[];
  memoryLoopCount?: number;
  memoryLoopLimitReached?: boolean;
  onChunk?: (content: string) => void;
  onComplete?: (message: ApiChatMessage) => void;
  onError?: (error: string) => void;
}

/**
 * Service class for managing message operations
 * Provides centralized message sending, streaming, and notification handling
 */
export class MessageService {
  private static instance: MessageService;

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Sends a message to a chat
   * Handles both streaming and non-streaming modes
   */
  public async sendMessage(options: SendMessageOptions): Promise<void> {
    const {
      chatId,
      content,
      useStreaming = true,
      memoryLoopCount = 0,
      memoryLoopLimitReached = false,
      onChunk,
      onComplete,
      onError,
    } = options;

    try {
      const state = store.getState();
      const chat = state.chats.chats[chatId];

      if (!chat) {
        const error = `Chat ${chatId} not found`;
        console.error(error);
        onError?.(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error,
          position: "bottom",
        });
        return;
      }

      // Add user message to chat
      const userMessage: ApiChatMessage = {
        role: "user",
        content,
        timestamp: Date.now(),
      };

      store.dispatch(addMessage({ id: chatId, message: userMessage }));

      // Prevent auto-generation during manual send
      store.dispatch(setAutoGenerateAnswer(false));

      // Get updated messages after adding user message
      const updatedState = store.getState();
      const updatedChat = updatedState.chats.chats[chatId];
      const messages = updatedChat.messages;

      // Send the message and get response
      if (useStreaming) {
        await this.sendMessageWithStreaming({
          chatId,
          messages,
          memories: chat.memories,
          memoryLoopCount,
          memoryLoopLimitReached,
          onChunk,
          onComplete,
          onError,
        });
      } else {
        await this.sendMessageWithoutStreaming({
          chatId,
          messages,
          memories: chat.memories,
          memoryLoopCount,
          memoryLoopLimitReached,
          onComplete,
          onError,
        });
      }

      // Update balance after successful send
      const balanceService = BalanceService.getInstance();
      await balanceService.updateBalanceIfAuthenticated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      console.error("MessageService.sendMessage error:", error);
      onError?.(errorMessage);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "bottom",
      });
    }
  }

  /**
   * Sends a message with streaming support
   */
  private async sendMessageWithStreaming(
    options: SendMessageStreamOptions
  ): Promise<void> {
    const {
      chatId,
      messages,
      memories,
      memoryLoopCount = 0,
      memoryLoopLimitReached = false,
      onChunk,
      onComplete,
      onError,
    } = options;

    const state = store.getState();
    const chatSettings = state.chats;

    let accumulated = "";
    let messageSignature: string | undefined;
    let assistantIndex = -1;
    let placeholderCreated = false;

    try {
      for await (const evt of ChatApiClient.sendMessageStream(
        chatSettings.model,
        chatSettings.humanPrompt,
        chatSettings.keepGoing,
        chatSettings.outsideBox,
        chatSettings.holisticTherapist,
        chatSettings.communicationStyle,
        messages,
        undefined,
        undefined,
        chatSettings.assistant_name,
        memories,
        undefined,
        undefined,
        undefined,
        chatSettings.libraryIntegrationEnabled,
        memoryLoopCount,
        memoryLoopLimitReached
      )) {
        switch (evt.type) {
          case "chunk": {
            // Create placeholder on first chunk
            if (!placeholderCreated) {
              const currentState = store.getState();
              const currentChat = currentState.chats.chats[chatId];
              const preLength = currentChat.messages.length;

              store.dispatch(
                addMessage({
                  id: chatId,
                  message: {
                    role: "assistant",
                    content: "",
                    signature: undefined,
                  } as ApiChatMessage,
                })
              );
              assistantIndex = preLength;
              placeholderCreated = true;
            }

            const part = typeof evt.data === "string" ? evt.data : "";
            accumulated += part;

            store.dispatch(
              updateMessageAtIndex({
                chatId,
                messageIndex: assistantIndex,
                content: accumulated,
              })
            );

            onChunk?.(accumulated);
            break;
          }

          case "signature": {
            messageSignature = evt.data;
            if (placeholderCreated && assistantIndex >= 0) {
              store.dispatch(
                updateMessageAtIndex({
                  chatId,
                  messageIndex: assistantIndex,
                  signature: evt.data,
                })
              );
            }
            break;
          }

          case "memory_request": {
            const rawKeys = evt.data?.keys ?? [];
            const keys = rawKeys.filter((x: string) =>
              StorageService.keyIsValid(x)
            );

            store.dispatch(
              addMemories({
                id: chatId,
                memories: keys,
              })
            );

            if (memoryLoopLimitReached || memoryLoopCount >= MAX_MEMORY_FETCH_LOOPS) {
              console.warn(
                "MessageService: memory request received but fetch limit reached"
              );
              return;
            }

            // Re-trigger send with updated memories
            const nextLoopCount = memoryLoopCount + 1;
            const nextLimitReached = nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;

            const updatedState = store.getState();
            const updatedChat = updatedState.chats.chats[chatId];

            await this.sendMessageWithStreaming({
              chatId,
              messages: updatedChat.messages,
              memories: updatedChat.memories,
              memoryLoopCount: nextLoopCount,
              memoryLoopLimitReached: nextLimitReached,
              onChunk,
              onComplete,
              onError,
            });
            return;
          }

          case "error": {
            const errorMsg =
              typeof evt.data === "string"
                ? evt.data
                : evt.data?.message ?? "Streaming error occurred";

            console.error("Streaming error:", evt.data);
            onError?.(errorMsg);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: errorMsg,
              position: "bottom",
            });
            return;
          }

          case "done": {
            break;
          }
        }
      }

      // Stream completed successfully
      if (onComplete && accumulated) {
        const assistantMessage: ApiChatMessage = {
          role: "assistant",
          content: accumulated,
          signature: messageSignature,
          timestamp: Date.now(),
        };
        onComplete(assistantMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Streaming failed";
      console.error("MessageService.sendMessageWithStreaming error:", error);
      onError?.(errorMessage);
      Toast.show({
        type: "error",
        text1: "Streaming Error",
        text2: errorMessage,
        position: "bottom",
      });
    }
  }

  /**
   * Sends a message without streaming (fallback)
   */
  private async sendMessageWithoutStreaming(
    options: Omit<SendMessageStreamOptions, "onChunk">
  ): Promise<void> {
    const {
      chatId,
      messages,
      memories,
      memoryLoopCount = 0,
      memoryLoopLimitReached = false,
      onComplete,
      onError,
    } = options;

    const state = store.getState();
    const chatSettings = state.chats;

    try {
      const response = await ChatApiClient.sendMessage(
        chatSettings.model,
        chatSettings.humanPrompt,
        chatSettings.keepGoing,
        chatSettings.outsideBox,
        chatSettings.holisticTherapist,
        chatSettings.communicationStyle,
        messages,
        undefined,
        undefined,
        chatSettings.assistant_name,
        memories,
        undefined,
        undefined,
        undefined,
        chatSettings.libraryIntegrationEnabled,
        memoryLoopCount,
        memoryLoopLimitReached
      );

      if ("requestForMemory" in response) {
        let keys = (response.requestForMemory as any).keys as string[];
        keys = keys.filter((x) => StorageService.keyIsValid(x));

        store.dispatch(
          addMemories({
            id: chatId,
            memories: keys,
          })
        );

        if (memoryLoopLimitReached || memoryLoopCount >= MAX_MEMORY_FETCH_LOOPS) {
          console.warn(
            "MessageService: non-streaming memory request ignored - limit reached"
          );
          return;
        }

        const nextLoopCount = memoryLoopCount + 1;
        const nextLimitReached = nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;

        const updatedState = store.getState();
        const updatedChat = updatedState.chats.chats[chatId];

        await this.sendMessageWithoutStreaming({
          chatId,
          messages: updatedChat.messages,
          memories: updatedChat.memories,
          memoryLoopCount: nextLoopCount,
          memoryLoopLimitReached: nextLimitReached,
          onComplete,
          onError,
        });
        return;
      }

      // Regular response
      const assistantMessage: ApiChatMessage = {
        role: "assistant",
        content: response.content,
        signature: response.signature,
        timestamp: Date.now(),
      };

      store.dispatch(addMessage({ id: chatId, message: assistantMessage }));

      onComplete?.(assistantMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      console.error("MessageService.sendMessageWithoutStreaming error:", error);
      onError?.(errorMessage);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "bottom",
      });
    }
  }

  /**
   * Regenerates an AI response for the current conversation.
   * Used after editing a message - doesn't add a new user message,
   * just sends the current messages to get a new response.
   */
  public async regenerateResponse(options: {
    chatId: string;
    useStreaming?: boolean;
    onChunk?: (content: string) => void;
    onComplete?: (message: ApiChatMessage) => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    const {
      chatId,
      useStreaming = true,
      onChunk,
      onComplete,
      onError,
    } = options;

    try {
      const state = store.getState();
      const chat = state.chats.chats[chatId];

      if (!chat) {
        const error = `Chat ${chatId} not found`;
        console.error(error);
        onError?.(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error,
          position: "bottom",
        });
        return;
      }

      // Prevent auto-generation during manual regeneration
      store.dispatch(setAutoGenerateAnswer(false));

      // Use current messages and memories from the chat
      const messages = chat.messages;
      const memories = chat.memories;

      // Send the message and get response
      if (useStreaming) {
        await this.sendMessageWithStreaming({
          chatId,
          messages,
          memories,
          onChunk,
          onComplete,
          onError,
        });
      } else {
        await this.sendMessageWithoutStreaming({
          chatId,
          messages,
          memories,
          onComplete,
          onError,
        });
      }

      // Update balance after successful send
      const balanceService = BalanceService.getInstance();
      await balanceService.updateBalanceIfAuthenticated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to regenerate response";
      console.error("MessageService.regenerateResponse error:", error);
      onError?.(errorMessage);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "bottom",
      });
    }
  }

  /**
   * Creates a new chat
   */
  public createChat(chatId: string, title?: string): void {
    store.dispatch(
      addChat({
        id: chatId,
        title,
        messages: [],
        memories: [],
      })
    );
  }

  /**
   * Gets all messages for a specific chat
   */
  public getChatMessages(chatId: string): ApiChatMessage[] {
    const state = store.getState();
    const chat = state.chats.chats[chatId];
    return chat?.messages ?? [];
  }

  /**
   * Checks if a chat exists
   */
  public chatExists(chatId: string): boolean {
    const state = store.getState();
    return !!state.chats.chats[chatId];
  }

  /**
   * Shows a notification for a new message
   */
  public showMessageNotification(
    title: string,
    message: string,
    type: "success" | "error" | "info" = "info"
  ): void {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "bottom",
      visibilityTime: 3000,
    });
  }
}
