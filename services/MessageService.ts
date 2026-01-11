import { store } from "../redux/store";
import {
  addChat,
  addMessage,
  updateMessageAtIndex,
  addMemories,
  setAutoGenerateAnswer,
} from "../redux/slices/chatsSlice";
import {
  addArtifact,
  updateArtifact,
  deleteArtifact,
  selectProjectArtifacts,
  Artifact,
} from "../redux/slices/artifactsSlice";
import {
  ChatApiClient,
  StreamEvent,
  ArtifactIndexItem,
  ArtifactToolCall,
  ARTIFACT_TOOL_SCHEMAS,
} from "../apiClients/ChatApiClient";
import { ApiChatMessage } from "../model/ChatRequest";
import Toast from "react-native-toast-message";
import { BalanceService } from "./BalanceService";
import StorageService from "./StorageService";
import { v4 as uuidv4 } from "uuid";

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
  artifactIndex?: ArtifactIndexItem[];
  tools?: typeof ARTIFACT_TOOL_SCHEMAS;
  toolCallLoopCount?: number;
  onChunk?: (content: string) => void;
  onComplete?: (message: ApiChatMessage) => void;
  onError?: (error: string) => void;
  onToolCall?: (toolCall: ArtifactToolCall) => void;
}

const MAX_TOOL_CALL_LOOPS = 10;

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
   * Builds an artifact index for a project.
   * Returns array of artifacts with path, name, mimeType, and type.
   * Path is constructed from parent hierarchy.
   */
  private buildArtifactIndex(projectId: string): ArtifactIndexItem[] {
    const state = store.getState();
    const artifacts = selectProjectArtifacts(state, projectId);

    // Build path for each artifact by traversing parent hierarchy
    const buildPath = (artifact: Artifact): string => {
      const parts: string[] = [artifact.name];
      let current = artifact;

      while (current.parentId) {
        const parent = state.artifacts.artifacts[current.parentId];
        if (parent) {
          parts.unshift(parent.name);
          current = parent;
        } else {
          break;
        }
      }

      return "/" + parts.join("/");
    };

    return artifacts.map((artifact) => ({
      path: buildPath(artifact),
      name: artifact.name,
      type: artifact.type,
      mimeType: artifact.type === "file" ? "text/plain" : undefined,
    }));
  }

  /**
   * Handles artifact tool calls from the AI.
   * Returns the result with artifact info for creating chat messages.
   */
  private handleArtifactToolCall(
    toolCall: ArtifactToolCall,
    projectId: string
  ): {
    message: string;
    artifactId?: string;
    artifactPath: string;
    isError: boolean;
    operation: "read" | "write" | "delete";
  } {
    const state = store.getState();
    const artifacts = selectProjectArtifacts(state, projectId);

    // Find artifact by path
    const findArtifactByPath = (path: string): Artifact | undefined => {
      const buildPath = (artifact: Artifact): string => {
        const parts: string[] = [artifact.name];
        let current = artifact;

        while (current.parentId) {
          const parent = state.artifacts.artifacts[current.parentId];
          if (parent) {
            parts.unshift(parent.name);
            current = parent;
          } else {
            break;
          }
        }

        return "/" + parts.join("/");
      };

      return artifacts.find((a) => buildPath(a) === path);
    };

    // Find parent artifact for a given path
    const findParentForPath = (
      path: string
    ): { parentId: string | null; name: string } => {
      const parts = path.split("/").filter(Boolean);
      const name = parts.pop() || "";

      if (parts.length === 0) {
        return { parentId: null, name };
      }

      const parentPath = "/" + parts.join("/");
      const parent = findArtifactByPath(parentPath);
      return { parentId: parent?.id || null, name };
    };

    const path = toolCall.arguments.path;

    switch (toolCall.name) {
      case "read_artifact": {
        const artifact = findArtifactByPath(path);
        if (!artifact) {
          return {
            message: `Artifact not found at path "${path}"`,
            artifactPath: path,
            isError: true,
            operation: "read" as const,
          };
        }
        if (artifact.type === "folder") {
          // Return folder contents listing
          const children = artifacts.filter((a) => a.parentId === artifact.id);
          const listing = children
            .map((c) => `${c.type === "folder" ? "[folder] " : ""}${c.name}`)
            .join("\n");
          return {
            message: `Folder contents of "${path}":\n${listing || "(empty)"}`,
            artifactId: artifact.id,
            artifactPath: path,
            isError: false,
            operation: "read" as const,
          };
        }
        return {
          message: artifact.content || "",
          artifactId: artifact.id,
          artifactPath: path,
          isError: false,
          operation: "read" as const,
        };
      }

      case "write_artifact": {
        const existing = findArtifactByPath(path);
        if (existing) {
          // Update existing artifact
          store.dispatch(
            updateArtifact({
              id: existing.id,
              updates: {
                content: toolCall.arguments.content,
                name: toolCall.arguments.name || existing.name,
              },
            })
          );
          return {
            message: `Updated artifact "${path}"`,
            artifactId: existing.id,
            artifactPath: path,
            isError: false,
            operation: "write" as const,
          };
        } else {
          // Create new artifact
          const { parentId, name } = findParentForPath(path);
          const newId = uuidv4();
          store.dispatch(
            addArtifact({
              id: newId,
              projectId,
              name: toolCall.arguments.name || name,
              type: "file",
              parentId,
              content: toolCall.arguments.content,
            })
          );
          return {
            message: `Created artifact "${path}"`,
            artifactId: newId,
            artifactPath: path,
            isError: false,
            operation: "write" as const,
          };
        }
      }

      case "delete_artifact": {
        const artifact = findArtifactByPath(path);
        if (!artifact) {
          return {
            message: `Artifact not found at path "${path}"`,
            artifactPath: path,
            isError: true,
            operation: "delete" as const,
          };
        }
        const deletedId = artifact.id;
        store.dispatch(deleteArtifact(deletedId));
        return {
          message: `Deleted artifact "${path}"`,
          artifactId: deletedId,
          artifactPath: path,
          isError: false,
          operation: "delete" as const,
        };
      }

      default:
        return {
          message: `Unknown tool "${(toolCall as any).name}"`,
          artifactPath: path,
          isError: true,
          operation: "read" as const,
        };
    }
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

      // Build artifact index and tools if chat is associated with a project
      const artifactIndex = chat.projectId
        ? this.buildArtifactIndex(chat.projectId)
        : undefined;
      const tools = chat.projectId ? ARTIFACT_TOOL_SCHEMAS : undefined;

      // Send the message and get response
      if (useStreaming) {
        await this.sendMessageWithStreaming({
          chatId,
          messages,
          memories: chat.memories,
          memoryLoopCount,
          memoryLoopLimitReached,
          artifactIndex,
          tools,
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
          artifactIndex,
          tools,
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
      artifactIndex,
      tools,
      toolCallLoopCount = 0,
      onChunk,
      onComplete,
      onError,
      onToolCall,
    } = options;

    const state = store.getState();
    const userSettings = state.userSettings;
    const chat = state.chats.chats[chatId];

    let accumulated = "";
    let messageSignature: string | undefined;
    let assistantIndex = -1;
    let placeholderCreated = false;

    // Track tool calls and their results for chaining
    const toolCallResults: Array<{
      toolCallId: string;
      name: string;
      result: string;
      isError: boolean;
    }> = [];

    try {
      for await (const evt of ChatApiClient.sendMessageStream(
        userSettings.model,
        userSettings.humanPrompt,
        userSettings.keepGoing,
        userSettings.outsideBox,
        userSettings.holisticTherapist,
        userSettings.communicationStyle,
        messages,
        undefined,
        undefined,
        userSettings.assistant_name,
        memories,
        undefined,
        undefined,
        undefined,
        userSettings.libraryIntegrationEnabled,
        memoryLoopCount,
        memoryLoopLimitReached,
        artifactIndex,
        tools
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

            // Rebuild artifact index and include tools with fresh state
            const updatedArtifactIndex = updatedChat.projectId
              ? this.buildArtifactIndex(updatedChat.projectId)
              : undefined;
            const updatedTools = updatedChat.projectId ? ARTIFACT_TOOL_SCHEMAS : undefined;

            await this.sendMessageWithStreaming({
              chatId,
              messages: updatedChat.messages,
              memories: updatedChat.memories,
              memoryLoopCount: nextLoopCount,
              memoryLoopLimitReached: nextLimitReached,
              artifactIndex: updatedArtifactIndex,
              tools: updatedTools,
              onChunk,
              onComplete,
              onError,
              onToolCall,
            });
            return;
          }

          case "tool_call": {
            const toolCall = evt.data;

            // Notify callback if provided
            onToolCall?.(toolCall);

            // Handle the tool call if chat is associated with a project
            if (chat?.projectId) {
              const result = this.handleArtifactToolCall(toolCall, chat.projectId);

              // Log the tool call result
              console.log(`Artifact tool call "${toolCall.name}":`, result);

              // Collect result for chaining
              toolCallResults.push({
                toolCallId: toolCall.id,
                name: toolCall.name,
                result: result.message,
                isError: result.isError,
              });

              // Add artifact operation message to chat (for write/delete, not read)
              if (result.operation !== "read") {
                const artifactMessage: ApiChatMessage = {
                  role: "assistant",
                  content: result.isError
                    ? `Error: ${result.message}`
                    : `${result.message}${result.artifactId ? `\n[View artifact](artifact://${result.artifactId})` : ""}`,
                  timestamp: Date.now(),
                };
                store.dispatch(addMessage({ id: chatId, message: artifactMessage }));
              }
            }
            break;
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

      // If there were tool calls, send results back to AI for chaining
      if (toolCallResults.length > 0 && toolCallLoopCount < MAX_TOOL_CALL_LOOPS) {
        // Format tool results as a user message
        const toolResultsContent = toolCallResults
          .map((r) => `[Tool Result: ${r.name}]\n${r.isError ? "Error: " : ""}${r.result}`)
          .join("\n\n");

        const toolResultMessage: ApiChatMessage = {
          role: "user",
          content: toolResultsContent,
          timestamp: Date.now(),
        };

        // Add to chat history
        store.dispatch(addMessage({ id: chatId, message: toolResultMessage }));

        // Get updated state with new messages
        const updatedState = store.getState();
        const updatedChat = updatedState.chats.chats[chatId];

        // Rebuild artifact index with fresh state
        const updatedArtifactIndex = updatedChat.projectId
          ? this.buildArtifactIndex(updatedChat.projectId)
          : undefined;

        // Build tools if project has artifacts
        const updatedTools = updatedChat.projectId ? ARTIFACT_TOOL_SCHEMAS : undefined;

        // Continue the conversation with tool results
        console.log(`Tool call loop ${toolCallLoopCount + 1}: sending ${toolCallResults.length} results back to AI`);

        await this.sendMessageWithStreaming({
          chatId,
          messages: updatedChat.messages,
          memories: updatedChat.memories,
          memoryLoopCount,
          memoryLoopLimitReached,
          artifactIndex: updatedArtifactIndex,
          tools: updatedTools,
          toolCallLoopCount: toolCallLoopCount + 1,
          onChunk,
          onComplete,
          onError,
          onToolCall,
        });
        return;
      }

      // Stream completed successfully - always call onComplete to stop typing indicator
      if (onComplete) {
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
      artifactIndex,
      tools,
      onComplete,
      onError,
    } = options;

    const state = store.getState();
    const userSettings = state.userSettings;

    try {
      const response = await ChatApiClient.sendMessage(
        userSettings.model,
        userSettings.humanPrompt,
        userSettings.keepGoing,
        userSettings.outsideBox,
        userSettings.holisticTherapist,
        userSettings.communicationStyle,
        messages,
        undefined,
        undefined,
        userSettings.assistant_name,
        memories,
        undefined,
        undefined,
        undefined,
        userSettings.libraryIntegrationEnabled,
        memoryLoopCount,
        memoryLoopLimitReached,
        artifactIndex,
        tools
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

        // Rebuild artifact index and tools with fresh state
        const updatedArtifactIndex = updatedChat.projectId
          ? this.buildArtifactIndex(updatedChat.projectId)
          : undefined;
        const updatedTools = updatedChat.projectId ? ARTIFACT_TOOL_SCHEMAS : undefined;

        await this.sendMessageWithoutStreaming({
          chatId,
          messages: updatedChat.messages,
          memories: updatedChat.memories,
          memoryLoopCount: nextLoopCount,
          memoryLoopLimitReached: nextLimitReached,
          artifactIndex: updatedArtifactIndex,
          tools: updatedTools,
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

      // Build artifact index and tools if chat is associated with a project
      const artifactIndex = chat.projectId
        ? this.buildArtifactIndex(chat.projectId)
        : undefined;
      const tools = chat.projectId ? ARTIFACT_TOOL_SCHEMAS : undefined;

      // Send the message and get response
      if (useStreaming) {
        await this.sendMessageWithStreaming({
          chatId,
          messages,
          memories,
          artifactIndex,
          tools,
          onChunk,
          onComplete,
          onError,
        });
      } else {
        await this.sendMessageWithoutStreaming({
          chatId,
          messages,
          memories,
          artifactIndex,
          tools,
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
