import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ChatHeaderProps {
  title: string | undefined;
  onBack: () => void;
}

export function ChatHeader({ title = 'Chat', onBack }: ChatHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: theme.background,
        borderBottomColor: colorScheme === 'dark' ? '#2D2D2D' : '#e0e0e0'
      }
    ]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backButtonText, { color: theme.text }]}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
