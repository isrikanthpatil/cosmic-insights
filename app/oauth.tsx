import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenBackground from '@/components/ScreenBackground';
import { completeGoogleAuth } from '@/utils/googleAuth';
import { showToast } from '@/utils/toast';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * OAuth return route. The server redirect page deep-links here as
 * cosmic-insights://oauth?code=...&state=... after Google sign-in. We redeem the
 * code (idempotent — the auth-session path may also redeem it) and then always
 * leave this screen so the user never gets stranded on it.
 */
export default function OAuthRedirect() {
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let ok = false;
      try {
        if (!error && code) ok = await completeGoogleAuth(String(code));
      } catch {
        ok = false;
      }
      if (!cancelled) {
        // Cold-start edge case: if the app was killed during the browser step the
        // PKCE verifier is gone, so the exchange can't complete — tell the user.
        if (!ok) showToast(t('oauth.signInFailed'), 'info');
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
      <Text style={styles.text}>{t('oauth.signingIn')}</Text>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#C7C4D6' },
});
