# iOS Quick Actions for Voice Chat

This document describes the implementation of iOS Quick Actions (3D Touch / Haptic Touch shortcuts) for launching voice chat sessions directly from the app launcher.

## Overview

Users can now long-press the ToGODer app icon on iOS to access two quick actions:
1. **Voice Chat** - Start a regular voice conversation
2. **Morning Routine** - Start a morning check-in with the `/wakeUp` system prompt

## Architecture

### Frontend Components

#### 1. iOS Quick Actions Configuration (`app.json`)
```json
"ios": {
  "infoPlist": {
    "UIApplicationShortcutItems": [
      {
        "UIApplicationShortcutItemType": "com.vanWifferen.ToGODer-app.voicechat",
        "UIApplicationShortcutItemTitle": "Voice Chat",
        "UIApplicationShortcutItemIconType": "UIApplicationShortcutIconTypeMicrophone"
      },
      {
        "UIApplicationShortcutItemType": "com.vanWifferen.ToGODer-app.morningroutine",
        "UIApplicationShortcutItemTitle": "Morning Routine",
        "UIApplicationShortcutItemSubtitle": "Start your day with intention",
        "UIApplicationShortcutItemIconType": "UIApplicationShortcutIconTypeSunrise"
      }
    ]
  }
}
```

#### 2. Quick Actions Hook (`hooks/useQuickActions.ts`)
- Detects iOS Quick Action launches via URL scheme
- Provides callback interface for handling different action types
- Supports both initial launch and runtime action handling

#### 3. Voice Chat Hook Enhancement (`hooks/useVoiceChat.ts`)
Added support for custom prompt modes:
```typescript
interface UseVoiceChatOptions {
  promptMode?: string; // e.g., '/wakeUp' for morning routine
}

export function useVoiceChat(options?: UseVoiceChatOptions)
```

#### 4. Voice Chat Screen Component (`components/VoiceChatScreen.tsx`)
- Full-screen voice chat interface
- Displays real-time transcripts
- Shows connection status
- Supports different modes (normal / morning routine)

#### 5. Routes
- `app/(drawer)/voice-chat.tsx` - Regular voice chat
- `app/(drawer)/morning-routine.tsx` - Morning routine with `/wakeUp` prompt

### Backend Components

#### 1. Wake Up System Prompt (`src/LLM/prompts/chatprompts.ts`)
New prompt for morning check-ins:
```typescript
export const WakeUpPrompt = "..."
```

Features:
- Focuses on daily intentions and aspirations
- Helps users align with their highest purpose
- Explores goals, concerns, and desired mindset for the day
- Provides energizing and forward-looking guidance

#### 2. Prompt List Update (`src/LLM/prompts/promptlist.ts`)
Added `/wakeUp` to the prompt list:
```typescript
'/wakeUp': {
  prompt: WakeUpPrompt,
  description: 'A morning check-in to set intentions for the day...',
  display: true,
  aliases: ['/morning', '/morningRoutine'],
}
```

#### 3. Realtime Voice Controller (`src/Web/RealtimeVoiceController.ts`)
Enhanced to handle `promptMode` parameter:
```typescript
const promptMode = params.get('promptMode');
if (promptMode) {
  chatRequest.prompts = [{
    role: 'user',
    content: promptMode, // e.g., '/wakeUp'
  }];
}
```

## How It Works

### 1. User Flow
1. User long-presses the ToGODer app icon on iOS
2. iOS displays Quick Action menu with "Voice Chat" and "Morning Routine" options
3. User taps one of the options
4. App launches (or comes to foreground if already running)
5. `useQuickActions` hook detects the action type
6. Router navigates to appropriate screen:
   - Voice Chat → `/(drawer)/voice-chat`
   - Morning Routine → `/(drawer)/morning-routine`
7. `VoiceChatScreen` component mounts and automatically starts voice chat
8. Voice chat connects to backend with appropriate `promptMode` parameter
9. Backend applies the corresponding system prompt (default or `/wakeUp`)

### 2. System Prompt Selection
The backend selects the system prompt based on the `promptMode` parameter:
- If `promptMode` is provided (e.g., `/wakeUp`), it's added as the first message
- The `ConversationApi.buildSystemPrompt` method checks the first prompt for a matching key in `PromptList`
- If found, uses that prompt; otherwise uses default prompt

### 3. Voice Chat Session
- WebSocket connection to OpenAI Realtime API
- Real-time audio streaming and transcription
- System prompt applied to the session configuration
- Transcripts displayed in the UI
- User can end the call at any time

## Testing

### Prerequisites
- iOS device or simulator with iOS 13+
- Xcode for building the iOS app
- Backend server running with voice chat support

### Test Steps

#### 1. Build and Install
```bash
cd ToGODer_app
npm install
npx expo prebuild --platform ios
npx expo run:ios
```

#### 2. Test Quick Actions
1. Install the app on an iOS device
2. Return to home screen
3. Long-press the ToGODer app icon
4. Verify two options appear:
   - "Voice Chat" with microphone icon
   - "Morning Routine" with sunrise icon and subtitle

#### 3. Test Voice Chat Launch
1. Tap "Voice Chat" from Quick Actions
2. Verify app opens to voice chat screen
3. Verify voice chat connects automatically
4. Speak and verify transcripts appear
5. Verify assistant responds appropriately (default behavior)
6. End call and verify cleanup

#### 4. Test Morning Routine Launch
1. Tap "Morning Routine" from Quick Actions
2. Verify app opens to morning routine screen
3. Verify voice chat connects with `/wakeUp` prompt
4. Speak and verify transcripts appear
5. Verify assistant responds with morning-focused questions:
   - How are you feeling?
   - What are your intentions for today?
   - What matters most today?
6. End call and verify cleanup

#### 5. Test While App is Running
1. Launch app normally
2. Go to home screen (don't close app)
3. Long-press app icon
4. Tap either Quick Action
5. Verify app comes to foreground and navigates to correct screen

### Troubleshooting

#### Quick Actions Not Appearing
- Ensure you're on iOS 13+ (3D Touch) or iOS 13+ (Haptic Touch)
- Rebuild the app with `npx expo prebuild --clean`
- Check `app.json` for correct configuration

#### Voice Chat Not Connecting
- Verify backend server is running
- Check API URL in `.env` file
- Verify microphone permissions are granted
- Check console logs for WebSocket errors

#### Wrong System Prompt Applied
- Verify `promptMode` parameter is being sent in URL
- Check backend logs for received parameters
- Verify `/wakeUp` exists in `PromptList`
- Check that first message matches prompt key

## Future Enhancements

1. **Additional Quick Actions**
   - Add shortcuts for other prompt modes (e.g., `/fiveMinuteCheckin`)
   - Dynamic Quick Actions based on time of day

2. **Customization**
   - Allow users to customize which Quick Actions appear
   - User-defined shortcuts for favorite prompts

3. **State Persistence**
   - Save Quick Action context to resume conversations
   - Auto-save voice chat transcripts

4. **Android Support**
   - Implement App Shortcuts for Android
   - Use similar architecture with different configuration

## Files Changed

### New Files
- `ToGODer_app/hooks/useQuickActions.ts`
- `ToGODer_app/components/VoiceChatScreen.tsx`
- `ToGODer_app/app/(drawer)/voice-chat.tsx`
- `ToGODer_app/app/(drawer)/morning-routine.tsx`
- `ToGODer_app/docs/iOS-Quick-Actions-Voice-Chat.md`

### Modified Files
- `ToGODer_app/app.json` - Added iOS Quick Actions configuration
- `ToGODer_app/app/_layout.tsx` - Integrated Quick Actions handler
- `ToGODer_app/hooks/useVoiceChat.ts` - Added prompt mode support
- `ToGODer/src/LLM/prompts/chatprompts.ts` - Added WakeUpPrompt
- `ToGODer/src/LLM/prompts/promptlist.ts` - Added `/wakeUp` entry
- `ToGODer/src/Web/RealtimeVoiceController.ts` - Added promptMode handling

## References

- [iOS Quick Actions Documentation](https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions)
- [Expo Linking API](https://docs.expo.dev/versions/latest/sdk/linking/)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)