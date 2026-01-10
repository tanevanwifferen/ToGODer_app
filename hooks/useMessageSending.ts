import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMemories,
  addMessage,
  deleteMessage,
  updateMessageAtIndex,
  setAutoGenerateAnswer,
} from "../redux/slices/chatsSlice";
import { useChat } from "../query-hooks/useChat";
import { ApiChatMessage } from "../model/ChatRequest";
import { BalanceService } from "../services/BalanceService";
import {
  selectCurrentChat,
  selectCurrentMessages,
  selectModel,
} from "../redux/slices/chatSelectors";
import { RootState } from "../redux/store";
import StorageService from "../services/StorageService";
import { useMemoryUpdates } from "./useMemoryUpdates";

const MAX_MEMORY_FETCH_LOOPS = 4;

/**
 * Hook for sending messages in a chat.
 * Extracts message sending logic into a focused, reusable hook.
 *
 * Phase 3 of the messaging architecture:
 * - Phase 1 (useChat): Low-level API coordination
 * - Phase 2 (useMessages): High-level chat orchestration
 * - Phase 3 (useMessageSending): Specialized message sending
 *
 * @param chatId - The ID of the chat to send messages in
 * @returns Object containing sendMessage function, state, and retry capability
 */
export const useMessageSending = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage: sendMessageApi, sendMessageStream, error: apiError } = useChat();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [lastMessageContent, setLastMessageContent] = useState<string | null>(null);

  const balanceService = BalanceService.getInstance();
  const chat = useSelector(selectCurrentChat);
  const messages = useSelector(selectCurrentMessages);
  const model = useSelector(selectModel);
  const assistant_name = useSelector(
    (state: RootState) => state.chats.assistant_name
  );
  const { updateMemory } = useMemoryUpdates(chatId);

  /**
   * Internal function that handles the complete message sending flow:
   * - Calls the API (streaming or non-streaming)
   * - Handles memory loop requests
   * - Updates Redux with assistant response
   * - Triggers balance and memory updates
   */
  const sendMessageAndHandleResponse = useCallback(
    async (loopCount = 0, forceLimit = false) => {
      if (!chat) {
        setError("Chat not found");
        return;
      }

      console.log("sendMessageAndHandleResponse", { loopCount, forceLimit });

      // Prevent any further auto-triggers until a NEW user message is appended
      dispatch(setAutoGenerateAnswer(false));
      setTyping(true);
      setIsLoading(true);
      setError(null);

      // Try streaming first; fall back to non-streaming otherwise
      let usedStreaming = false;
      let assistantIndex = -1;
      let accumulated = "";
      let messageSignature: string | undefined = undefined;
      let gotStreamData = false;
      let placeholderCreated = false;

      const requestOptions = {
        memoryLoopCount: loopCount,
        memoryLoopLimitReached:
          forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS,
      };

      try {
        if (sendMessageStream) {
          usedStreaming = false;
          console.log(
            "useMessageSending: starting streaming attempt",
            requestOptions
          );

          // Consume the streaming response
          for await (const evt of sendMessageStream(
            messages,
            chat.memories,
            requestOptions
          )) {
            if (evt?.type) {
              gotStreamData = true;
            }

            switch (evt.type) {
              case "chunk": {
                // Create placeholder on first chunk
                if (!placeholderCreated) {
                  const preLength = messages?.length ?? 0;
                  dispatch(
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
                usedStreaming = true;

                // Handle both string payloads and { delta: string } objects
                const ed: any = (evt as any).data;
                const part = typeof ed === "string" ? ed : ed?.delta ?? "";
                accumulated += part;

                dispatch(
                  updateMessageAtIndex({
                    chatId,
                    messageIndex: assistantIndex,
                    content: accumulated,
                  })
                );
                break;
              }

              case "memory_request": {
                // Remove placeholder if it was created
                if (placeholderCreated && assistantIndex >= 0) {
                  dispatch(
                    deleteMessage({
                      chatId,
                      messageIndex: assistantIndex,
                    })
                  );
                }

                const rawKeys = evt.data?.keys ?? [];
                const keys = rawKeys.filter((x: string) =>
                  StorageService.keyIsValid(x)
                );

                dispatch(
                  addMemories({
                    id: chatId,
                    memories: keys,
                  })
                );

                setTyping(false);
                setIsLoading(false);

                if (forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS) {
                  console.warn(
                    "useMessageSending: memory request received but fetch limit reached"
                  );
                  return;
                }

                const nextLoopCount = loopCount + 1;
                const nextLimitReached = nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;

                console.log(
                  "useMessageSending: streaming memory_request, re-sending",
                  {
                    nextLoopCount,
                    nextLimitReached,
                  }
                );

                // Re-trigger send with updated memories
                sendMessageAndHandleResponse(nextLoopCount, nextLimitReached);
                return;
              }

              case "signature": {
                messageSignature = evt.data;

                // Apply signature when available
                if (placeholderCreated && assistantIndex >= 0) {
                  dispatch(
                    updateMessageAtIndex({
                      chatId,
                      messageIndex: assistantIndex,
                      signature: evt.data,
                    })
                  );
                }
                break;
              }

              case "error": {
                const errorMsg =
                  typeof evt.data === "string"
                    ? evt.data
                    : evt.data?.message ?? "Streaming error occurred";

                console.error("Streaming error received:", evt.data);

                // Remove placeholder if created
                if (placeholderCreated && assistantIndex >= 0) {
                  dispatch(
                    deleteMessage({
                      chatId,
                      messageIndex: assistantIndex,
                    })
                  );
                }

                setError(errorMsg);
                setTyping(false);
                setIsLoading(false);
                return;
              }

              case "done": {
                // Finalize streaming
                break;
              }
            }
          }

          console.log(
            "useMessageSending: streaming finished. gotStreamData=",
            gotStreamData,
            " usedStreaming=",
            usedStreaming
          );

          if (!usedStreaming) {
            console.log(
              "useMessageSending: no stream chunks received; will fallback"
            );
          }
        } else {
          usedStreaming = false;
        }
      } catch (_streamErr) {
        usedStreaming = false;
        console.log("useMessageSending: streaming threw, falling back", _streamErr);
      }

      // If streaming didn't work, use non-streaming fallback
      if (!usedStreaming) {
        try {
          console.log("useMessageSending: invoking non-streaming fallback");
          const response = await sendMessageApi(
            messages,
            chat.memories,
            requestOptions
          );

          if ("requestForMemory" in response) {
            // Non-streaming memory request
            if (placeholderCreated && assistantIndex >= 0) {
              dispatch(
                deleteMessage({
                  chatId,
                  messageIndex: assistantIndex,
                })
              );
            }

            var keys = (response.requestForMemory as any).keys as string[];
            keys = keys.filter((x) => StorageService.keyIsValid(x));

            console.log("addkeys", keys);
            dispatch(
              addMemories({
                id: chatId,
                memories: keys,
              })
            );

            setTyping(false);
            setIsLoading(false);

            if (forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS) {
              console.warn(
                "useMessageSending: non-streaming memory request ignored - limit reached"
              );
              return;
            }

            const nextLoopCount = loopCount + 1;
            const nextLimitReached = nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;
            await sendMessageAndHandleResponse(nextLoopCount, nextLimitReached);
            return;
          }

          // Content message (non-streaming)
          const apiAssistantMessage: ApiChatMessage = {
            role: "assistant",
            content: response.content,
            signature: response.signature,
          };

          accumulated = apiAssistantMessage.content ?? "";
          messageSignature = apiAssistantMessage.signature;

          if (placeholderCreated && assistantIndex >= 0) {
            // Update existing placeholder
            dispatch(
              updateMessageAtIndex({
                chatId,
                messageIndex: assistantIndex,
                content: apiAssistantMessage.content,
                signature: apiAssistantMessage.signature,
              })
            );
          } else {
            // Add new assistant message
            dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to send message"
          );
          setTyping(false);
          setIsLoading(false);
          return;
        }
      }

      setTyping(false);
      setIsLoading(false);
      balanceService.updateBalanceIfAuthenticated();

      // Trigger memory update asynchronously
      const assistantMsg: ApiChatMessage = {
        role: "assistant",
        content: accumulated,
        signature: messageSignature,
      };

      updateMemory(
        model,
        [...messages, assistantMsg],
        chat?.memories || "",
        assistant_name
      );
    },
    [
      chatId,
      sendMessageApi,
      sendMessageStream,
      dispatch,
      chat,
      balanceService,
      model,
      assistant_name,
      messages,
      updateMemory,
    ]
  );

  /**
   * Send a message in the chat.
   * Adds the user message to Redux and triggers the send flow.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!chat) {
        setError("Chat not found");
        return;
      }

      setLastMessageContent(content);

      const apiUserMessage: ApiChatMessage = {
        role: "user",
        content,
      };

      dispatch(addMessage({ id: chatId, message: apiUserMessage }));

      // Trigger the send and response handling
      await sendMessageAndHandleResponse();
    },
    [chatId, dispatch, chat, sendMessageAndHandleResponse]
  );

  /**
   * Retry sending the last message.
   * Useful when an error occurs during sending.
   */
  const retry = useCallback(() => {
    if (!chat || !lastMessageContent) return;

    setError(null);

    // Remove the last message if it's a user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      dispatch(
        deleteMessage({ chatId, messageIndex: messages.length - 1 })
      );
    }

    // Resend the message
    sendMessage(lastMessageContent);
  }, [chatId, dispatch, chat, lastMessageContent, messages, sendMessage]);

  return {
    sendMessage,
    retry,
    isLoading,
    typing,
    error: error || apiError?.message || null,
  };
};
