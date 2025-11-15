import { Audio } from "expo-av";
import LiveAudioStream from "react-native-live-audio-stream";
import type { MutableRefObject } from "react";

export interface DeviceAudioHandlers {
  startCapture: (ws: WebSocket) => Promise<void>;
  enqueuePlayback: (base64Audio: string) => void;
  cleanup: () => Promise<void>;
}

export interface WebAudioDeps {
  mediaStreamRef: MutableRefObject<MediaStream | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  audioQueueRef: MutableRefObject<string[]>;
  isPlayingRef: MutableRefObject<boolean>;
}

export interface MobileAudioDeps {
  pcmChunkQueueRef: MutableRefObject<string[]>;
  processingAudioRef: MutableRefObject<boolean>;
  soundRef: MutableRefObject<Audio.Sound | null>;
}

export function createWebAudioHandlers({
  audioContextRef,
  audioQueueRef,
  isPlayingRef,
  mediaStreamRef,
}: WebAudioDeps): DeviceAudioHandlers {
  const playWebAudioChunk = async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioData = base64ToArrayBuffer(base64Audio);
        const pcm16Data = new Int16Array(audioData);
        const float32Data = new Float32Array(pcm16Data.length);
        for (let i = 0; i < pcm16Data.length; i++) {
          float32Data[i] = pcm16Data[i] / 32768.0;
        }

        if (!audioContextRef.current) {
          reject(new Error("AudioContext missing for web playback"));
          return;
        }

        const audioBuffer = audioContextRef.current.createBuffer(
          1,
          float32Data.length,
          24000
        );
        audioBuffer.copyToChannel(float32Data, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          console.log("Web audio chunk finished playing");
          resolve();
        };
        source.start();
        console.log("Web audio playback started");
      } catch (err) {
        console.error("Error in web audio playback:", err);
        reject(err);
      }
    });
  };

  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    console.log("Starting web audio queue processing");

    while (audioQueueRef.current.length > 0) {
      const base64Audio = audioQueueRef.current.shift();
      if (!base64Audio) continue;

      try {
        await playWebAudioChunk(base64Audio);
      } catch (err) {
        console.error("Error playing web audio chunk:", err);
      }
    }

    isPlayingRef.current = false;
    console.log("Web audio queue processing completed");
  };

  const startCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket not open, cannot send audio");
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = convertFloat32ToPCM16(inputData);
        const base64Audio = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

        if (Math.random() < 0.01) {
          console.log(
            `Sending audio chunk to server: ${base64Audio.length} bytes (base64)`
          );
        }

        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio,
          })
        );
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Error starting web audio capture:", err);
      throw err;
    }
  };

  const enqueuePlayback = (base64Audio: string) => {
    audioQueueRef.current.push(base64Audio);
    if (!isPlayingRef.current) {
      processAudioQueue();
    }
  };

  const cleanup = async () => {
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (err) {
        console.warn("Error closing AudioContext:", err);
      }
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  return { startCapture, enqueuePlayback, cleanup };
}

export function createMobileAudioHandlers({
  pcmChunkQueueRef,
  processingAudioRef,
  soundRef,
}: MobileAudioDeps): DeviceAudioHandlers {
  let hasPrimedPlayback = false;
  let stopCapture: (() => void) | null = null;

  const playMobileWavFile = async (wavDataUri: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: wavDataUri },
          {
            shouldPlay: true,
            volume: 1.0,
            isLooping: false,
            rate: 1.0,
            shouldCorrectPitch: false,
          }
        );

        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (unloadErr) {
              console.warn("Error unloading sound:", unloadErr);
            }
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
            resolve();
          } else if ("error" in status && status.error) {
            console.error("Mobile WAV playback error:", status.error);
            try {
              await sound.unloadAsync();
            } catch (unloadErr) {
              console.warn("Error unloading sound after error:", unloadErr);
            }
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
            reject(new Error(String(status.error)));
          }
        });
      } catch (err) {
        console.error("Error playing mobile WAV file:", err);
        soundRef.current = null;
        reject(err);
      }
    });
  };

  const processMobileAudioQueue = async () => {
    if (processingAudioRef.current || pcmChunkQueueRef.current.length === 0) {
      return;
    }

    const MIN_CHUNKS_TO_START = 8;
    const MIN_CHUNKS_ONGOING = 8;
    const minChunks = hasPrimedPlayback
      ? MIN_CHUNKS_ONGOING
      : MIN_CHUNKS_TO_START;

    if (pcmChunkQueueRef.current.length < minChunks) {
      setTimeout(() => processMobileAudioQueue(), 50);
      return;
    }

    processingAudioRef.current = true;

    try {
      const chunksToProcess = Math.min(12, pcmChunkQueueRef.current.length);
      const chunks = pcmChunkQueueRef.current.splice(0, chunksToProcess);
      const combinedPcm = chunks.join("");
      console.log(
        `Processing ${chunksToProcess} mobile audio chunks (${pcmChunkQueueRef.current.length} remaining)`
      );

      const wavDataUri = pcm16ToWav(combinedPcm);
      await playMobileWavFile(wavDataUri);
      hasPrimedPlayback = true;
    } catch (err) {
      console.error("Error in mobile audio queue processing:", err);
      setTimeout(() => processMobileAudioQueue(), 100);
    } finally {
      processingAudioRef.current = false;
      if (pcmChunkQueueRef.current.length > 0) {
        processMobileAudioQueue();
      }
    }
  };

  const startCapture = async (ws: WebSocket) => {
    try {
      console.log("Starting mobile audio capture with LiveAudioStream...");
      const options = {
        sampleRate: 24000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 4096,
        wavFile: "voice_chat.wav",
      };

      LiveAudioStream.init(options);
      if (typeof (LiveAudioStream as any).removeAllListeners === "function") {
        (LiveAudioStream as any).removeAllListeners("data");
      }
      LiveAudioStream.on("data", (data: string) => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn(
            "WebSocket not open, cannot send audio. State:",
            ws.readyState
          );
          return;
        }

        if (Math.random() < 0.01) {
          console.log(`Sending mobile audio chunk: ${data.length} bytes (base64)`);
        }

        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data,
          })
        );
      });

      LiveAudioStream.start();
      stopCapture = () => {
        try {
          LiveAudioStream.stop();
          console.log("Mobile audio streaming stopped");
        } catch (err) {
          console.error("Error stopping mobile audio:", err);
        }
      };
    } catch (err) {
      console.error("Error starting mobile audio capture:", err);
      throw err;
    }
  };

  const enqueuePlayback = (base64Audio: string) => {
    pcmChunkQueueRef.current.push(base64Audio);
    processMobileAudioQueue();
  };

  const cleanup = async () => {
    if (stopCapture) {
      stopCapture();
      stopCapture = null;
    }

    if (typeof (LiveAudioStream as any).removeAllListeners === "function") {
      (LiveAudioStream as any).removeAllListeners("data");
    }

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        console.error("Error stopping mobile audio:", err);
      }
      soundRef.current = null;
    }

    pcmChunkQueueRef.current = [];
    processingAudioRef.current = false;
    hasPrimedPlayback = false;
  };

  return { startCapture, enqueuePlayback, cleanup };
}

function convertFloat32ToPCM16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcm16ToWav(base64Audio: string): string {
  try {
    const audioData = base64ToArrayBuffer(base64Audio);
    const pcm16Data = new Int16Array(audioData);
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * channels * bitsPerSample) / 8;
    const blockAlign = (channels * bitsPerSample) / 8;
    const dataSize = pcm16Data.length * 2;
    const fileSize = 36 + dataSize;

    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    view.setUint32(0, 0x46464952, true);
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x45564157, true);
    view.setUint32(12, 0x20746d66, true);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x61746164, true);
    view.setUint32(40, dataSize, true);

    const wavBuffer = new ArrayBuffer(44 + pcm16Data.length * 2);
    const wavView = new Uint8Array(wavBuffer);
    wavView.set(new Uint8Array(header), 0);
    const pcmBytes = new Uint8Array(pcm16Data.buffer);
    wavView.set(pcmBytes, 44);

    const base64Wav = btoa(String.fromCharCode(...wavView));
    return `data:audio/wav;base64,${base64Wav}`;
  } catch (err) {
    console.error("Error converting PCM16 to WAV:", err);
    throw err;
  }
}
