/**
 * Layout for shared conversation routes.
 * Handles navigation configuration and screen options for shared routes.
 * Includes necessary providers for shared conversation functionality.
 */

import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../redux/store';
import { QueryProvider } from '../../components/providers/QueryProvider';
import { ExperienceProvider } from '../../components/providers/ExperienceProvider';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function SharedLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ExperienceProvider>
              <View style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ title: 'Shared Conversations' }} />
                  <Stack.Screen
                    name="[id]"
                    options={{
                      title: undefined, // Will be set dynamically in the screen component
                      headerShown: true
                    }}
                  />
                </Stack>
              </View>
            </ExperienceProvider>
          </ThemeProvider>
        </QueryProvider>
      </PersistGate>
    </Provider>
  );
}