import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useBalance } from '../../hooks/useBalance';

interface BalanceDisplayProps {
  isAuthenticated: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isAuthenticated }) => {
  const {
    balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useBalance();

  if (!isAuthenticated) return null;

  if (isBalanceLoading) {
    return (
      <ThemedView style={styles.balanceContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </ThemedView>
    );
  }

  if (balanceError) {
    return (
      <ThemedView style={styles.balanceContainer}>
        <ThemedText style={styles.balanceError}>
          Failed to load balance
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.balanceContainer}>
      <ThemedText style={styles.balanceLabel}>Balance:</ThemedText>
      <ThemedText style={styles.balanceValue}>
        {Number(balance).toFixed(2)}$
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  balanceError: {
    color: 'red',
    fontSize: 14,
  },
});
