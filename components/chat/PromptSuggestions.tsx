import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from 'react-native';

interface PromptSuggestionsProps {
  prompts: [string, { description: string }][];
  onSelectPrompt: (key: string) => void;
}

export function PromptSuggestions({ prompts, onSelectPrompt }: PromptSuggestionsProps) {
  if (prompts.length === 0) return null;

  return (
    <ScrollView style={styles.promptsContainer}>
      {prompts.map(([key, prompt]) => (
        <TouchableOpacity
          key={key}
          style={styles.promptItem}
          onPress={() => onSelectPrompt(key)}
        >
          <Text style={styles.promptKey}>{key}</Text>
          <Text style={styles.promptDesc} numberOfLines={6}>{prompt.description.replace(/\s+/g, ' ')}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  promptsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    margin: 8,
  },
  promptItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  promptKey: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 80,
  },
  promptDesc: {
    flex: 1,
    color: '#666',
  },
});
