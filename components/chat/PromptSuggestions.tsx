import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

interface PromptSuggestionsProps {
  prompts: [string, { description: string }][];
  onSelectPrompt: (key: string) => void;
}

export function PromptSuggestions({ prompts, onSelectPrompt }: PromptSuggestionsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  if (prompts.length === 0) return null;

  return (
    <ScrollView style={[
      styles.promptsContainer,
      {
        backgroundColor: theme.background,
        borderColor: colorScheme === 'dark' ? '#2D2D2D' : '#e0e0e0'
      }
    ]}>
      {prompts.map(([key, prompt]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.promptItem,
            {
              borderBottomColor: colorScheme === 'dark' ? '#2D2D2D' : '#e0e0e0'
            }
          ]}
          onPress={() => onSelectPrompt(key)}
        >
          <Text style={[styles.promptKey, { color: theme.text }]}>{key}</Text>
          <Text 
            style={[
              styles.promptDesc,
              { color: colorScheme === 'dark' ? '#9BA1A6' : '#666' }
            ]} 
            numberOfLines={6}
          >
            {prompt.description.replace(/\s+/g, ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  promptsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 4,
    margin: 8,
  },
  promptItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  promptKey: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 80,
  },
  promptDesc: {
    flex: 1,
  },
});
