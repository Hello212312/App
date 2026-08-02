import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import ErrorBoundary from './components/error-boundary';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      // You can add analytics or state logging here
      // e.g., track when user backgrounds/foregrounds the app
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            // Enable swipe-to-go-back gesture for iOS
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerBackVisible: true,
            headerTintColor: '#007AFF',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
              gestureEnabled: true,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

