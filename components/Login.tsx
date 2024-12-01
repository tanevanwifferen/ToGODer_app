import React, { useEffect, useState } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AuthApiClient } from "../apiClients/AuthApiClient";
import { setAuthData } from "../redux/slices/authSlice";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useBalance } from "../hooks/useBalance";
import { GlobalApiClient } from "../apiClients/GlobalApiClient";
import { setBalance } from "../redux/slices/balanceSlice";
import { CreateAccount } from "./CreateAccount";
import { ForgotPassword } from "./ForgotPassword";
import { clearAllChats } from '../redux/slices/chatsSlice';
import { clearPasscode } from '../redux/slices/passcodeSlice';
import { usePasscode } from '../hooks/usePasscode';

export const Login = () => {
  const auth = useSelector((state: any) => state.auth);
  const isAuthenticated = auth?.token;
  const {
    balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useBalance();
  const { resetPasscode } = usePasscode();
  const [email, setEmail] = useState(auth?.email || "");
  const [view, setView] = useState<"login" | "loggedIn" | "createAccount" | "forgotPassword">(
    auth?.token ? "loggedIn" : "login"
  );
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState(auth?.password || "");
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (auth?.email) setEmail(auth.email);
    if (auth?.password) setPassword(auth.password);
  }, [auth]);

  const handleLogin = async () => {
    try {
      setError("");
      const response = await AuthApiClient.login(email, password);
      dispatch(setAuthData({ email, password, ...response }));
      const balance = await GlobalApiClient.getBalance();
      dispatch(setBalance(balance.balance));
      if(response.token){
        setView("loggedIn");
      } else {
        setError(response as unknown as string);
      }
    } catch (err: any) {
      setError(err);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "For privacy reason logging out will delete all your " +
      "chats and they cannot be recovered. Are you sure you " +
      "want to proceed?", 
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setError("");
              dispatch(clearAllChats());
              dispatch(clearPasscode());
              dispatch(
                setAuthData({
                  email: "",
                  password: "",
                  token: "",
                  isAuthenticated: false,
                })
              );
              setView("login");
            } catch (err: any) {
              setError(err);
            }
          }
        }
      ]
    );
  };

  const handleResetPasscode = () => {
    Alert.alert(
      "Reset Passcode",
      "Are you sure you want to reset your passcode?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: resetPasscode
        }
      ]
    );
  };

  const renderBalance = () => {
    if (!auth?.token) return null;

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

  return (
    <ThemedView style={styles.container}>
      {error ? (
        <ThemedText style={styles.error}>{JSON.stringify(error)}</ThemedText>
      ) : null}

      {view == "createAccount" && <CreateAccount setView={setView} />}

      {view == "login" && (
        <>
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
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, {marginTop: 15}]}
            onPress={() => setView("createAccount")}
          >
            <ThemedText style={styles.buttonText}>Create Account</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setView("forgotPassword")}
          >
            <ThemedText style={styles.linkText}>Forgot Password?</ThemedText>
          </TouchableOpacity>
        </>
      )}

      {view == "forgotPassword" && <ForgotPassword setView={setView} />}

      {view == "loggedIn" && (
        <>
          {renderBalance()}
          <Text>{email}</Text>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <ThemedText style={styles.buttonText}>Logout</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResetPasscode}
          >
            <ThemedText style={styles.buttonText}>Reset Passcode</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
  balanceError: {
    color: "red",
    fontSize: 14,
  },
  linkButton: {
    marginTop: 15,
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
