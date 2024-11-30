import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { useSelector } from 'react-redux';
import { selectQuote } from '../../redux/slices/globalConfigSlice';
import { useExperience } from '@/hooks/useExperience';

export function EmptyChat() {
  const quote = useSelector(selectQuote);
  const {showLanguageSelector} = useExperience();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{quote}</Text>
      <Button onPress={showLanguageSelector} title="Start Experience" />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleY: -1 }],
    padding: 25
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 50,
  }
});
