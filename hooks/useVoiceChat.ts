import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import { getApiUrl } from "../constants/Env";
import { useSelector } from "react-redux";
import {
  selectModel,
  selectHumanPrompt,
  selectKeepGoing,
  selectOutsideBox,
  selectCommunicationStyle,
  selectHolisticTherapist,
} from "../redux/slices/chatSelectors";
import { selectPersonalData } from "../redux/slices/personalSlice";
import { selectCustomSystemPrompt } from "../redux/slices/systemPromptSlice";
import { RootState } from "../redux";
import { ChatRequestCommunicationStyle } from "../model/ChatRequest";
import {
  createMobileAudioHandlers,
  createWebAudioHandlers,
  type DeviceAudioHandlers,
} from "./voiceChat/deviceHandlers";

interface VoiceChatTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface UseVoiceChatOptions {
  /** Custom system prompt mode (e.g., '/wakeUp' for morning routine) */
  promptMode?: string;
}

/**
 * Hook for managing OpenAI Realtime API voice chat
 */
export function useVoiceChat(options?: UseVoiceChatOptions) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<VoiceChatTranscript[]>([]);
  const transcriptsRef = useRef<VoiceChatTranscript[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  // iOS-specific: accumulate PCM chunks before converting to WAV
  const pcmChunkQueueRef = useRef<string[]>([]);
  const processingAudioRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<{ user: string; assistant: string }>({
    user: "",
    assistant: "",
  });
  const isWeb = Platform.OS === "web";
  const deviceHandlers = useMemo<DeviceAudioHandlers>(
    () =>
      isWeb
        ? createWebAudioHandlers({
            audioContextRef,
            audioQueueRef,
            isPlayingRef,
            mediaStreamRef,
          })
        : createMobileAudioHandlers({
            pcmChunkQueueRef,
            processingAudioRef,
            soundRef,
          }),
    [isWeb]
  );

  // Get configuration from Redux
  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const holisticTherapist = useSelector(selectHolisticTherapist);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const personalData = useSelector(selectPersonalData);
  const customSystemPrompt = useSelector(selectCustomSystemPrompt);
  const persona = useSelector((state: RootState) => state.personal.persona);
  const assistant_name = useSelector(
    (state: RootState) => state.chats.assistant_name
  );
  const authToken = useSelector((state: RootState) => state.auth?.token);

  const addTranscript = useCallback(
    (role: "user" | "assistant", text: string) => {
      if (!text || !text.trim()) return;

      setTranscripts((prev) => [
        ...prev,
        {
          role,
          text: text.trim(),
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  const startVoiceChat = useCallback(async () => {
    if (isActive || isConnecting) return;

    setIsConnecting(true);
    setError(null);
    currentTranscriptRef.current = { user: "", assistant: "" };

    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Microphone permission denied");
      }

      // Set audio mode for better voice chat experience - force speaker on iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Initialize audio streaming for mobile
      if (Platform.OS !== "web") {
        console.log("Mobile audio streaming initialized");
      }

      // Build WebSocket URL with configuration
      const baseUrl = getApiUrl();
      const wsUrl = baseUrl
        .replace("http://", "ws://")
        .replace("https://", "wss://");

      const configurableData =
        typeof personalData === "string"
          ? personalData
          : JSON.stringify(personalData);

      const params = new URLSearchParams({
        model: "gpt-realtime",
        humanPrompt: String(humanPrompt || false),
        keepGoing: String(keepGoing || false),
        outsideBox: String(outsideBox || false),
        holisticTherapist: String(holisticTherapist || false),
        communicationStyle:
          communicationStyle?.toString() ||
          ChatRequestCommunicationStyle.AdaptToConversant.toString(),
        assistant_name: assistant_name || "ToGODer",
        configurableData,
      });

      // Add custom prompt mode if specified (e.g., '/wakeUp' for morning routine)
      if (options?.promptMode) {
        params.append("promptMode", options.promptMode);
      }

      if (customSystemPrompt) {
        params.append("customSystemPrompt", customSystemPrompt);
      }
      if (persona) {
        params.append("persona", persona);
      }

      // Add token to URL params for authentication
      // WebSocket doesn't support custom headers in browsers, so we pass token as query param
      if (authToken) {
        params.append("token", authToken);
      }

      const fullWsUrl = `${wsUrl}/realtime/ws?${params.toString()}`;

      // Log connection attempt (mask token for security)
      const safeUrl = fullWsUrl.replace(/token=[^&]+/, "token=***");
      console.log("Attempting voice chat WebSocket connection to:", safeUrl);

      // Create WebSocket connection
      const ws = new WebSocket(fullWsUrl);

      // Set binary type to handle text messages properly
      if (Platform.OS === "web") {
        ws.binaryType = "arraybuffer"; // Handle binary data as ArrayBuffer, not Blob
      }

      wsRef.current = ws;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error("WebSocket connection timeout");
          setError(
            "Connection timeout - check if backend server is running and accessible"
          );
          ws.close();
          setIsConnecting(false);
          setIsActive(false);
        }
      }, 10000); // 10 second timeout

      ws.onopen = async () => {
        console.log("Voice chat WebSocket connected successfully");
        clearTimeout(connectionTimeout);
        setIsActive(true);
        setIsConnecting(false);

        // Start audio capture
        await deviceHandlers.startCapture(ws);
      };

      ws.onmessage = async (event) => {
        try {
          const data = event.data;

          // OpenAI Realtime API sends JSON messages (text)
          // The audio is embedded as base64 within JSON, not sent as raw binary
          if (typeof data === "string") {
            // JSON message
            try {
              const message = JSON.parse(data);

              // Log significant message types
              if (message.type && !message.type.includes(".delta")) {
                console.log("Received WebSocket message type:", message.type);
              }

              handleRealtimeMessage(message);
            } catch (parseErr) {
              console.error(
                "Error parsing WebSocket message as JSON:",
                parseErr
              );
              console.error(
                "Raw data (first 200 chars):",
                data.substring(0, 200)
              );
            }
          } else if (data instanceof Blob) {
            // Convert Blob to text first (web browsers sometimes send text as Blob)
            console.log("Received Blob, converting to text...");
            const text = await data.text();
            try {
              const message = JSON.parse(text);

              if (message.type && !message.type.includes(".delta")) {
                console.log("Received WebSocket message type:", message.type);
              }

              handleRealtimeMessage(message);
            } catch (parseErr) {
              console.error("Error parsing Blob content as JSON:", parseErr);
            }
          } else if (data instanceof ArrayBuffer) {
            // Convert ArrayBuffer to text
            console.log("Received ArrayBuffer, converting to text...");
            const decoder = new TextDecoder();
            const text = decoder.decode(data);
            try {
              const message = JSON.parse(text);

              if (message.type && !message.type.includes(".delta")) {
                console.log("Received WebSocket message type:", message.type);
              }

              handleRealtimeMessage(message);
            } catch (parseErr) {
              console.error(
                "Error parsing ArrayBuffer content as JSON:",
                parseErr
              );
            }
          } else {
            console.warn(
              "Received unexpected WebSocket data type:",
              typeof data
            );
          }
        } catch (err) {
          console.error("Error in WebSocket message handler:", err);
        }
      };

      ws.onerror = (event: any) => {
        console.error("WebSocket error:", event);
        const errorMsg =
          event.message ||
          event.error?.message ||
          "WebSocket connection failed";
        console.error(
          "Full WebSocket URL (without token):",
          fullWsUrl.replace(/token=[^&]+/, "token=***")
        );
        setError(`Connection error: ${errorMsg}`);
        stopVoiceChat();
      };

      ws.onclose = (event) => {
        console.log(
          "Voice chat WebSocket closed. Code:",
          event.code,
          "Reason:",
          event.reason
        );
        clearTimeout(connectionTimeout);
        setIsActive(false);
        setIsConnecting(false);

        // Provide specific error messages based on close codes
        if (event.code === 1000) {
          // Normal closure - no error
        } else if (event.code === 1005) {
          // No status received - likely a server error during setup
          // Show the reason if provided, otherwise show a generic message
          if (event.reason && event.reason.trim()) {
            setError(event.reason);
          } else {
            setError(
              "Connection closed by server. Please check server logs for details."
            );
          }
        } else if (event.code === 1008) {
          setError(event.reason || "Authentication failed");
        } else if (event.code === 1011) {
          setError(event.reason || "Backend server error occurred");
        } else {
          // Any other non-normal closure
          setError(
            event.reason ||
              `Connection closed unexpectedly (code: ${event.code})`
          );
        }

        stopVoiceChat();
      };
    } catch (err) {
      console.error("Error starting voice chat:", err);
      console.error("API URL from env:", getApiUrl());

      let errorMessage = "Failed to start voice chat";
      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide helpful hints for common errors
        if (err.message.includes("permission")) {
          errorMessage += " - Check microphone permissions";
        } else if (err.message.includes("WebSocket")) {
          errorMessage += " - Check backend server connection";
        }
      }

      setError(errorMessage);
      setIsConnecting(false);
      setIsActive(false);
    }
  }, [
    isActive,
    isConnecting,
    model,
    humanPrompt,
    keepGoing,
    outsideBox,
    holisticTherapist,
    communicationStyle,
    personalData,
    customSystemPrompt,
    persona,
    assistant_name,
    deviceHandlers,
  ]);

  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case "conversation.item.input_audio_transcription.completed":
        currentTranscriptRef.current.user += message.transcript || "";
        if (message.transcript) {
          addTranscript("user", message.transcript);
        }
        break;

      case "response.audio_transcript.delta":
        currentTranscriptRef.current.assistant += message.delta || "";
        break;

      case "response.audio_transcript.done":
        if (currentTranscriptRef.current.assistant) {
          addTranscript("assistant", currentTranscriptRef.current.assistant);
          currentTranscriptRef.current.assistant = "";
        }
        break;

      case "response.audio.delta":
        // Play audio chunk
        if (message.delta) {
          deviceHandlers.enqueuePlayback(message.delta);
        }
        break;

      case "response.audio.done":
        // Flush any remaining audio chunks when response is complete
        console.log("Audio response complete, flushing remaining chunks");
        deviceHandlers.flushPlayback().catch((err) => {
          console.error("Error flushing audio playback:", err);
        });
        break;

      case "error":
        console.error("Realtime API error:", message.error);
        setError(message.error?.message || "An error occurred");
        break;
    }
  };

  const stopVoiceChat = useCallback(async () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop recording
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
      recordingRef.current = null;
    }

    await deviceHandlers.cleanup();

    // Save final transcripts only if they haven't been added already
    // Check if the last transcript matches what we have in the buffer to avoid duplicates
    const transcriptHistory = transcriptsRef.current;

    if (currentTranscriptRef.current.user) {
      const lastTranscript = transcriptHistory[transcriptHistory.length - 1];
      if (
        !lastTranscript ||
        lastTranscript.role !== "user" ||
        lastTranscript.text !== currentTranscriptRef.current.user
      ) {
        addTranscript("user", currentTranscriptRef.current.user);
      }
    }
    if (currentTranscriptRef.current.assistant) {
      const lastTranscript = transcriptHistory[transcriptHistory.length - 1];
      if (
        !lastTranscript ||
        lastTranscript.role !== "assistant" ||
        lastTranscript.text !== currentTranscriptRef.current.assistant
      ) {
        addTranscript("assistant", currentTranscriptRef.current.assistant);
      }
    }

    setIsActive(false);
    setIsConnecting(false);
  }, [addTranscript, deviceHandlers]);

  // Cleanup on unmount
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, [stopVoiceChat]);

  return {
    isActive,
    isConnecting,
    error,
    transcripts,
    startVoiceChat,
    stopVoiceChat,
  };
}
