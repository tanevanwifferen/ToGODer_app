import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../redux/store';
import { QueryProvider } from '../components/providers/QueryProvider';
import { ExperienceProvider } from '../components/providers/ExperienceProvider';
import { BackgroundFetchProvider } from '../components/providers/BackgroundFetchProvider';
import { RouteProvider } from '../components/providers/RouteProvider';
import { useColorScheme } from '../hooks/useColorScheme';
import { useInitialization } from '../hooks/useInitialization';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    MaterialIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"),
    Feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
    AntDesign: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf"),
  });
  useInitialization();

  // Handle deep linking
  useEffect(() => {
    // Handle URLs when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle URLs when app is not running and is opened via URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Parse and handle the deep link URL
  const handleDeepLink = (url: string) => {
    const { hostname, path } = Linking.parse(url);
    
    // Get hostname from EXPO_PUBLIC_SHARE_URL
    const shareUrl = process.env.EXPO_PUBLIC_SHARE_URL;
    const validHostname = shareUrl ? new URL(shareUrl).hostname : null;
    
    // Check if it's a shared chat URL from either the app scheme or web URL
    if (path) {
      // Handle both app scheme and web URL formats
      const match = path.match(/^shared\/([^\/]+)$/) || path.match(/^\/shared\/([^\/]+)$/);
      if (match && (!hostname || hostname === validHostname)) {
        const chatId = match[1];
        router.push(`/shared/${chatId}`);
      }
    }
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RouteProvider>
              <ExperienceProvider>
                <BackgroundFetchProvider>
                  <GestureHandlerRootView style={styles.container}>
                  <Stack>
                    <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                  </GestureHandlerRootView>
                </BackgroundFetchProvider>
              </ExperienceProvider>
            </RouteProvider>
          </ThemeProvider>
        </QueryProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
