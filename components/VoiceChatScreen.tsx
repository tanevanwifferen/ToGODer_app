import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

interface VoiceChatScreenProps {
  /** Mode for the voice chat (e.g., '/wakeUp' for morning routine) */
  mode?: string;
  /** Title to display at the top of the screen */
  title?: string;
}

/**
 * Full-screen voice chat interface
 * Can be launched with different modes (normal voice chat or morning routine)
 */
export function VoiceChatScreen({ mode, title = 'Voice Chat' }: VoiceChatScreenProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  
  const {
    isActive,
    isConnecting,
    error,
    transcripts,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat(mode ? { promptMode: mode } : undefined);

  // Start voice chat automatically when component mounts
  useEffect(() => {
    startVoiceChat();
    
    // Cleanup: stop voice chat when component unmounts
    return () => {
      stopVoiceChat();
    };
  }, []);

  const handleClose = () => {
    stopVoiceChat();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.tint }]}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        {isConnecting && (
          <View style={styles.statusItem}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              Connecting...
            </Text>
          </View>
        )}
        
        {isActive && !isConnecting && (
          <View style={styles.statusItem}>
            <View style={[styles.activeIndicator, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              Voice chat active
            </Text>
            <Text style={[styles.subtitleText, { color: theme.text }]}>
              Speak naturally - I'm listening
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.statusItem}>
            <Ionicons name="alert-circle" size={48} color="#f44336" />
            <Text style={[styles.errorText, { color: '#f44336' }]}>
              {error}
            </Text>
          </View>
        )}
      </View>

      {/* Transcripts */}
      <View style={styles.transcriptsContainer}>
        {transcripts.length > 0 ? (
          transcripts.map((transcript, index) => (
            <View
              key={`${transcript.timestamp}-${index}`}
              style={[
                styles.transcriptBubble,
                transcript.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
                {
                  backgroundColor:
                    transcript.role === 'user'
                      ? theme.tint
                      : colorScheme === 'dark'
                      ? '#333'
                      : '#f0f0f0',
                },
              ]}
            >
              <Text
                style={[
                  styles.transcriptText,
                  {
                    color:
                      transcript.role === 'user'
                        ? '#fff'
                        : theme.text,
                  },
                ]}
              >
                {transcript.text}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.placeholderText, { color: theme.text }]}>
            {isActive
              ? 'Start speaking...'
              : 'Waiting to connect...'}
          </Text>
        )}
      </View>

      {/* End Call Button */}
      {isActive && (
        <TouchableOpacity
          style={[styles.endCallButton, { backgroundColor: '#f44336' }]}
          onPress={handleClose}
        >
          <Ionicons name="call" size={32} color="#fff" />
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusItem: {
    alignItems: 'center',
    gap: 16,
  },
  activeIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  subtitleText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  transcriptsContainer: {
    flex: 2,
    padding: 16,
  },
  transcriptBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  transcriptText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 20,
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: 20,
    padding: 16,
    borderRadius: 30,
  },
  endCallText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});