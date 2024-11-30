import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AuthApiClient } from '../apiClients/AuthApiClient';
import { setAuthData } from '../redux/slices/authSlice';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export const Login = () => {
  const auth = useSelector((state: any) => state.auth);
  const [email, setEmail] = useState(auth?.email || '');
  const [password, setPassword] = useState(auth?.password || '');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if (auth?.email) setEmail(auth.email);
    if (auth?.password) setPassword(auth.password);
  }, [auth]);

  const handleLogin = async () => {
    try {
      setError('');
      const response = await AuthApiClient.login(email, password);
      dispatch(setAuthData({email, password, ...response}));
    } catch (err:any) {
      setError(err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {error ? <ThemedText style={styles.error}>{JSON.stringify(error)}</ThemedText> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
      >
        <ThemedText style={styles.buttonText}>Login</ThemedText>
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
});
