import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

interface ChatHeaderProps {
  title: string | undefined;
  onBack: () => void;
}

export function ChatHeader({ title = 'Chat', onBack }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
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
    borderBottomColor: '#e0e0e0',
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
