import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectPasscode, unlockApp } from '../../redux/slices/passcodeSlice';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

export function LockScreen() {
  const dispatch = useDispatch();
  const correctPasscode = useSelector(selectPasscode);
  const [passcode, setPasscode] = useState('');

  const handleSubmit = () => {
    if (passcode === correctPasscode) {
      dispatch(unlockApp());
    } else {
      Alert.alert('Error', 'Incorrect passcode');
      setPasscode('');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Enter Passcode</ThemedText>
      <ThemedText style={styles.subtitle}>
        Enter your 4-digit passcode to unlock the app
      </ThemedText>
      
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        value={passcode}
        onChangeText={setPasscode}
        onSubmitEditing={handleSubmit}
        autoFocus
      />
      
      {passcode.length === 4 && (
        <ThemedText style={styles.button} onPress={handleSubmit}>
          Unlock
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: 200,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
  },
  button: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '500',
  },
});
