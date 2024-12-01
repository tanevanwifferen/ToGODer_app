import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { usePasscode } from '../../hooks/usePasscode';

interface LoggedInViewProps {
  email: string;
  onLogout: () => void;
}

export const LoggedInView: React.FC<LoggedInViewProps> = ({
  email,
  onLogout,
}) => {
  const { resetPasscode } = usePasscode();

  const handleResetPasscode = () => {
    CustomAlert.alert(
      'Reset Passcode',
      'Are you sure you want to reset your passcode?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: resetPasscode
        }
      ]
    );
  };

  return (
    <>
      <Text>{email}</Text>
      <TouchableOpacity style={styles.button} onPress={onLogout}>
        <ThemedText style={styles.buttonText}>Logout</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handleResetPasscode}
      >
        <ThemedText style={styles.buttonText}>Reset Passcode</ThemedText>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
