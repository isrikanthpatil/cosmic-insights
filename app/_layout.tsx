import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChartProvider } from '@/contexts/ChartContext';
import ToastHost from '@/components/ToastHost';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();

  // Wait for the auth store to hydrate so logged-in users don't briefly see
  // the guest dashboard on cold start. Guests fall through to the tabs.
  if (isLoading) {
    return null;
  }

  // GUEST-OPEN: always render the tabs. There is no hard auth gate; signing
  // in is reachable via the `login` modal route below.
  return (
    <ChartProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ChartProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootNavigator />
      <ToastHost />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
