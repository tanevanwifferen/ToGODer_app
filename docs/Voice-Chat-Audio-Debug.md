# Voice Chat Audio Debugging Guide

## Issues Identified

### 1. Mobile Audio Capture NOT Working ❌
**Problem**: The Expo Audio Recording API (`expo-av`) doesn't support real-time audio streaming on mobile devices.

**Current Implementation Issue**:
- Line 295-343 in `hooks/useVoiceChat.ts`: Recording starts but audio is never sent to the server
- Expo only allows reading the complete audio file AFTER stopping the recording
- No way to read audio chunks in real-time with expo-av

**Impact**: Users on iPhone/Android cannot send voice to the server

### 2. Mobile Audio Playback NOT Implemented ❌
**Problem**: Audio playback only works on web platform, mobile devices can't hear the assistant's responses.

**Current Implementation**:
- Line 376-427: `playAudioChunk()` only handles web with AudioContext
- Mobile platforms just log "accumulating chunks" but don't play audio
- Expo's `Audio.Sound` requires a file URI, not streaming audio chunks

**Impact**: Users on iPhone/Android cannot hear the assistant's voice responses

### 3. Web Audio Working ✅
**Fixed**: Web platform audio capture and playback now working correctly
- Audio is captured via `getUserMedia` and `ScriptProcessorNode`
- PCM16 conversion implemented correctly
- Playback handles OpenAI's PCM16 format and converts to Float32

## Solutions

### Option A: Use react-native-webrtc (RECOMMENDED)
Best solution for real-time audio streaming on mobile.

```bash
npm install react-native-webrtc
```

**Pros**:
- Full WebRTC support with real-time audio streaming
- Cross-platform (iOS, Android, Web)
- Used by major video chat apps
- Supports bidirectional audio streaming

**Implementation**:
```typescript
import { mediaDevices } from 'react-native-webrtc';

// Get microphone stream
const stream = await mediaDevices.getUserMedia({ audio: true });
const audioTrack = stream.getAudioTracks()[0];

// Process audio in real-time (requires native module)
// Send chunks to WebSocket
```

### Option B: Use expo-audio (NEW)
Expo's new audio API (in preview) may support streaming.

```bash
npx expo install expo-audio
```

**Note**: Still in preview, check current status before implementing.

### Option C: Use react-native-live-audio-stream
Lightweight library specifically for audio streaming.

```bash
npm install react-native-live-audio-stream
```

**Pros**:
- Simple API
- Real-time audio chunks
- Configurable sample rate and format

**Implementation**:
```typescript
import LiveAudioStream from 'react-native-live-audio-stream';

LiveAudioStream.init({
  sampleRate: 24000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6, // VOICE_COMMUNICATION
});

LiveAudioStream.on('data', (data) => {
  // data is base64 encoded PCM
  ws.send(JSON.stringify({
    type: "input_audio_buffer.append",
    audio: data,
  }));
});

LiveAudioStream.start();
```

### Option D: Web-Only Approach (TEMPORARY)
Temporarily disable mobile support and only support web until proper streaming library is integrated.

```typescript
if (Platform.OS !== 'web') {
  throw new Error('Voice chat is currently only supported on web browsers. Mobile support coming soon!');
}
```

## Current Debugging Logs Added

The following logs have been added to track audio flow:

### Client Side (useVoiceChat.ts)
1. **Connection**: "Attempting voice chat WebSocket connection to: [url]"
2. **Connection Success**: "Voice chat WebSocket connected successfully"
3. **Audio Capture Start (Mobile)**: "Starting mobile audio capture..."
4. **Audio Capture Success (Mobile)**: "Mobile audio recording started successfully"
5. **Recording Progress (Mobile)**: "Recording Xms of audio..."
6. **Audio Sending (Web)**: "Sending audio chunk to server: X bytes" (1% sample)
7. **Message Receipt**: "Received WebSocket message type: [type]"
8. **Audio Playback**: "Playing audio chunk, length: X"
9. **Web Playback**: "Web audio playback started"
10. **Mobile Playback**: "Mobile audio playback - accumulating chunks"

### Server Side (RealtimeVoiceService.ts)
1. **Connection**: "Connected to OpenAI Realtime API"
2. **Message Forward**: Errors logged if relay fails
3. **Session End**: "Realtime voice connection closed"

## Testing Audio Flow

### Web Testing
1. Open browser console (F12)
2. Start voice chat
3. Look for these logs:
   - ✅ "Voice chat WebSocket connected successfully"
   - ✅ "Sending audio chunk to server: X bytes" (when speaking)
   - ✅ "Received WebSocket message type: response.audio.delta" (assistant responding)
   - ✅ "Playing audio chunk"
   - ✅ "Web audio playback started"

4. Check microphone indicator in browser
5. Verify audio is working in browser settings

### Mobile Testing (Current State)
1. Open React Native debugger or console
2. Start voice chat
3. You'll see:
   - ✅ "Voice chat WebSocket connected successfully"
   - ✅ "Starting mobile audio capture..."
   - ✅ "Mobile audio recording started successfully"
   - ❌ No "Sending audio chunk" messages (audio not sent)
   - ⚠️ "Mobile audio playback - accumulating chunks" (but no actual playback)

## Recommended Next Steps

1. **Immediate**: Test web version to confirm web audio is working
2. **Short-term**: Implement Option A (react-native-webrtc) for production-quality mobile support
3. **Alternative**: Implement Option C (react-native-live-audio-stream) for simpler mobile solution
4. **Temporary Workaround**: Show error message on mobile explaining web-only limitation

## Testing Commands

```bash
# Web testing (Chrome/Firefox/Safari)
npm start
# Then open http://localhost:8081 in browser

# Mobile testing (will show audio not working)
npm run ios
# or
npm run android
```

## Console Errors to Watch For

### Client Side
- "Error starting mobile audio capture" - Permission or library issue
- "WebSocket not open, cannot send audio" - Connection dropped
- "Error playing audio chunk" - Audio decode/playback failure

### Server Side  
- "OpenAI Realtime API WebSocket error" - OpenAI connection issue
- "Error processing client message" - Invalid message format
- "Error processing OpenAI message" - Invalid response from OpenAI

## Architecture Overview

```
Mobile/Web App                Backend Server              OpenAI Realtime API
     |                              |                            |
     |--[WebSocket Connect]-------->|                            |
     |                              |--[WebSocket Connect]------>|
     |                              |<--[session.update]---------|
     |<--[Connected]---------------|                            |
     |                              |                            |
     |--[audio base64]------------->|--[forward]---------------->|
     |                              |<--[transcription]----------|
     |<--[forward]------------------|                            |
     |                              |<--[audio delta]------------|
     |<--[forward]------------------|                            |
     |--[playback audio]            |                            |
```

## File References

- **Mobile Audio Capture**: [`hooks/useVoiceChat.ts:295-343`](../hooks/useVoiceChat.ts#L295-L343)
- **Mobile Audio Playback**: [`hooks/useVoiceChat.ts:376-427`](../hooks/useVoiceChat.ts#L376-L427)
- **Web Audio Capture**: [`hooks/useVoiceChat.ts:262-293`](../hooks/useVoiceChat.ts#L262-L293)
- **Server Relay**: [`src/Services/RealtimeVoiceService.ts:149-237`](../../ToGODer/src/Services/RealtimeVoiceService.ts#L149-L237)