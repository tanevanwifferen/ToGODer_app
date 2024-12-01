import React, { useState } from 'react';
import { TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthApiClient } from '../apiClients/AuthApiClient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export const ForgotPassword = ({
  setView
}: {
  setView: (view: "login" | "loggedIn" | "createAccount" | "forgotPassword") => void
}) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [message, setMessage] = useState('');

  const handleSendCode = async () => {
    try {
      setError('');
      if (!email) {
        setError('Email is required');
        return;
      }
      await AuthApiClient.sendForgotPasswordEmail(email);
      setMessage('Reset code has been sent to your email');
      setStep('reset');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleResetPassword = async () => {
    try {
      setError('');
      if (!code || !newPassword || !confirmPassword) {
        setError('All fields are required');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      await AuthApiClient.setNewPassword(code, email, newPassword);
      setMessage('Password reset successful');
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  return (
    <ThemedView style={styles.container}>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}

      {step === 'email' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TouchableOpacity style={styles.button} onPress={handleSendCode}>
            <ThemedText style={styles.buttonText}>Send Reset Code</ThemedText>
          </TouchableOpacity>
        </>
      )}

      {step === 'reset' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Reset Code"
            value={code}
            onChangeText={setCode}
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <ThemedText style={styles.buttonText}>Reset Password</ThemedText>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => setView('login')}
      >
        <ThemedText style={styles.linkText}>Back to Login</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    color: 'green',
    marginBottom: 15,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
