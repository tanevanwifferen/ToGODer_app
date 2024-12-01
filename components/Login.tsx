import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { CreateAccount } from './CreateAccount';
import { ForgotPassword } from './ForgotPassword';
import { useAuth } from '../hooks/useAuth';
import { BalanceDisplay } from './login/BalanceDisplay';
import { LoginForm } from './login/LoginForm';
import { LoggedInView } from './login/LoggedInView';

export const Login = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isAuthenticated,
    handleLogin,
    handleLogout
  } = useAuth();
  
  const [view, setView] = useState<'login' | 'loggedIn' | 'createAccount' | 'forgotPassword'>(
    isAuthenticated ? 'loggedIn' : 'login'
  );

  const onLogin = async () => {
    const success = await handleLogin();
    if (success) {
      setView('loggedIn');
    }
  };

  const onLogout = async () => {
    if(await handleLogout()){
      setView('login');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {error ? (
        <ThemedText style={styles.error}>{JSON.stringify(error)}</ThemedText>
      ) : null}

      {view === 'createAccount' && <CreateAccount setView={setView} />}

      {view === 'login' && (
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onLogin={onLogin}
          onCreateAccount={() => setView('createAccount')}
          onForgotPassword={() => setView('forgotPassword')}
        />
      )}

      {view === 'forgotPassword' && <ForgotPassword setView={setView} />}

      {view === 'loggedIn' && (
        <>
          <BalanceDisplay isAuthenticated={isAuthenticated} />
          <LoggedInView
            email={email}
            onLogout={onLogout}
          />
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});
