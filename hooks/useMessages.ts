import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  selectAutoGenerateAnswer,
  selectCurrentChat,
  selectCurrentMemories,
  selectCurrentMessages,
} from "../redux/slices/chatSelectors";
import { selectModel, selectAssistantName } from "../redux/slices/userSettingsSlice";
import { RootState } from "../redux/store";
import StorageService from "../services/StorageService";
import { useMemoryUpdates } from "./useMemoryUpdates";

const MAX_MEMORY_FETCH_LOOPS = 4;

export const useMessages = (chatId: string) => {
  const dispatch = useDispatch();
  const { sendMessage, sendMessageStream, error } = useChat();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const balanceService = BalanceService.getInstance();

  const chat = useSelector(selectCurrentChat);
  const memories = useSelector(selectCurrentMemories);
  const messages = useSelector(selectCurrentMessages);
  const autoGenerateAnswer = useSelector(selectAutoGenerateAnswer);
  const model = useSelector(selectModel);
  const assistant_name = useSelector(selectAssistantName);
  const { updateMemory } = useMemoryUpdates(chatId);

  const retrySend = useCallback(() => {
    setErrorMessage(null);
    if (!chat) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role == "user") {
      dispatch(
        deleteMessage({ chatId, messageIndex: chat.messages.length - 1 })
      );
      onSend(lastMessage.content);
    }
  }, [chatId, dispatch, chat]);

  const onSend = useCallback(
    async (content: string) => {
      if (!chat) return;
      const apiUserMessage: ApiChatMessage = {
        role: "user",
        content,
      };
      dispatch(addMessage({ id: chatId, message: apiUserMessage }));
    },
    [chatId, dispatch, chat]
  );

  useEffect(() => {
    // Only trigger auto-send when the last message is from the user AND
    // auto_generate_answer is enabled. We also rely on setAutoGenerateAnswer(false)
    // at send start to prevent re-entrant duplicates.
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user" && autoGenerateAnswer) {
        sendMessageAndHandleResponse();
      }
    }
    // Important: do NOT depend on memories; that caused re-triggers while last message
    // was still a user message (before assistant placeholder/response arrived).
  }, [messages]);

  const sendMessageAndHandleResponse = useCallback(
    async (loopCount = 0, forceLimit = false) => {
      if (!chat) return;
      console.log("sendMessageAndHandleResponse", { loopCount, forceLimit });
      // Prevent any further auto-triggers until a NEW user message is appended.
      // addMessage(user) will set auto_generate_answer back to true.
      dispatch(setAutoGenerateAnswer(false));
      setTyping(true);

      // Try streaming first; fall back to non-streaming otherwise
      let usedStreaming = false;
      let assistantIndex = -1;
      let accumulated = "";
      let messageSignature: string | undefined = undefined;
      // Track whether we actually received any streaming data (chunk/signature/memory_request)
      // If not, we will fallback to non-streaming.
      let gotStreamData = false;
      let placeholderCreated = false;

      const requestOptions = {
        memoryLoopCount: loopCount,
        memoryLoopLimitReached:
          forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS,
      };

      // Don't create placeholder yet - wait to see if streaming works

      try {
        if (sendMessageStream) {
          // Only consider streaming "used" if we actually get data
          usedStreaming = false;
          console.log(
            "useMessages: starting streaming attempt",
            requestOptions
          );
          // Consume the SSE stream (or compatible transport)
          for await (const evt of sendMessageStream(
            messages,
            chat.memories,
            requestOptions
          )) {
            // Mark that we received something from the stream (even signature/memory_request)
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
                // Only remove placeholder if it was created
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
                if (forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS) {
                  console.warn(
                    "useMessages: memory request received but fetch limit reached"
                  );
                  return;
                }
                const nextLoopCount = loopCount + 1;
                const nextLimitReached =
                  nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;
                console.log(
                  "useMessages: streaming memory_request, re-sending",
                  {
                    nextLoopCount,
                    nextLimitReached,
                  }
                );
                // Re-trigger send with updated memories.
                // Fire-and-forget to avoid blocking the current loop.
                sendMessageAndHandleResponse(nextLoopCount, nextLimitReached);
                return;
              }
              case "signature": {
                // Store signature for later use
                messageSignature = evt.data;
                // apply signature when available (content may still be updating)
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
                // Handle streaming error - display to user and stop streaming
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

                // Set error message for user display
                setErrorMessage(errorMsg);
                setTyping(false);

                // Don't throw - just stop streaming gracefully
                return;
              }
              case "done": {
                // finalize
                break;
              }
            }
          }
          console.log(
            "useMessages: streaming finished. gotStreamData=",
            gotStreamData,
            " usedStreaming=",
            usedStreaming
          );
          // If stream produced no chunk content, treat as not used so we fallback
          if (!usedStreaming) {
            console.log(
              "useMessages: no stream chunks received; will fallback"
            );
          }
        } else {
          usedStreaming = false;
        }
      } catch (_streamErr) {
        usedStreaming = false;
        console.log("useMessages: streaming threw, falling back", _streamErr);
        // continue to non-streaming fallback
      }

      // If we didn't receive any streaming chunks, or streaming failed, use non-streaming fallback
      if (!usedStreaming) {
        try {
          console.log("useMessages: invoking non-streaming fallback");
          const response = await sendMessage(
            messages,
            chat.memories,
            requestOptions
          );

          if ("requestForMemory" in response) {
            // Non-streaming memory request: remove placeholder if created
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
            if (forceLimit || loopCount >= MAX_MEMORY_FETCH_LOOPS) {
              console.warn(
                "useMessages: non-streaming memory request ignored - limit reached"
              );
              return;
            }
            const nextLoopCount = loopCount + 1;
            const nextLimitReached = nextLoopCount >= MAX_MEMORY_FETCH_LOOPS;
            await sendMessageAndHandleResponse(nextLoopCount, nextLimitReached);
            return;
          }

          // content message (non-streaming)
          const apiAssistantMessage: ApiChatMessage = {
            role: "assistant",
            content: response.content,
            signature: response.signature,
          };
          // capture for memory update
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
            // Add new assistant message since no placeholder was created
            dispatch(addMessage({ id: chatId, message: apiAssistantMessage }));
          }
        } catch (err) {
          // Non-streaming failed as well
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to send message"
          );
          setTyping(false);
          return;
        }
      }

      setTyping(false);
      balanceService.updateBalanceIfAuthenticated();

      // Trigger memory update asynchronously using the streamed content
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
      sendMessage,
      sendMessageStream,
      dispatch,
      chat,
      balanceService,
      model,
      assistant_name,
      messages,
    ]
  );

  const onDeleteMessage = useCallback(
    (messageIndex: number) => {
      dispatch(deleteMessage({ chatId, messageIndex }));
    },
    [chatId, dispatch]
  );

  useEffect(() => {
    setErrorMessage(error?.message ?? null);
  }, [error]);

  return {
    messages,
    onSend,
    onDeleteMessage,
    typing,
    errorMessage,
    retrySend,
  };
};
