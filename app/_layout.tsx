import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initMobileAds } from '@/utils/ads';
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
import { PremiumProvider } from '@/contexts/PremiumContext';
import ToastHost from '@/components/ToastHost';
import DesktopGate from '@/components/DesktopGate';
import TranslatingBadge from '@/components/TranslatingBadge';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
      <PremiumProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="match" options={{ headerShown: false }} />
          <Stack.Screen name="kundli" options={{ headerShown: false }} />
          <Stack.Screen name="tarot" options={{ headerShown: false }} />
          <Stack.Screen name="panchang" options={{ headerShown: false }} />
          <Stack.Screen name="sade-sati" options={{ headerShown: false }} />
          <Stack.Screen name="dasha" options={{ headerShown: false }} />
          <Stack.Screen name="charts" options={{ headerShown: false }} />
          <Stack.Screen name="oauth" options={{ headerShown: false }} />
          <Stack.Screen name="reports" options={{ headerShown: false }} />
          <Stack.Screen name="report" options={{ headerShown: false }} />
          <Stack.Screen name="premium" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </PremiumProvider>
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

  // Initialize the Google Mobile Ads SDK once at startup. On web this resolves to
  // utils/ads.web.ts (a no-op), so the native ads module is never bundled for web.
  useEffect(() => {
    initMobileAds();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <DesktopGate>
          <RootNavigator />
          <ToastHost />
          <TranslatingBadge />
          <StatusBar style="auto" />
        </DesktopGate>
      </AuthProvider>
    </LanguageProvider>
  );
}
