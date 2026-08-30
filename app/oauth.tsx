import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenBackground from '@/components/ScreenBackground';
import { completeGoogleAuth } from '@/utils/googleAuth';

/**
 * OAuth return route. The server redirect page deep-links here as
 * cosmic-insights://oauth?code=...&state=... after Google sign-in. We redeem the
 * code (idempotent — the auth-session path may also redeem it) and then always
 * leave this screen so the user never gets stranded on it.
 */
export default function OAuthRedirect() {
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!error && code) await completeGoogleAuth(String(code));
      } catch {
        // Swallow — the login screen will still be usable for a retry.
      }
      if (!cancelled) {
        try { if (router.canDismiss()) router.dismissAll(); } catch {}
        router.replace('/(tabs)');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenBackground style={styles.container}>
      <ActivityIndicator size="large" color="#E8C87E" />
      <Text style={styles.text}>Signing you in…</Text>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#C7C4D6' },
});
