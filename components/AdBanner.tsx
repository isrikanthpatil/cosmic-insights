import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePremium } from '@/contexts/PremiumContext';

// Real unit in production; Google's test unit in dev (never click your own live ads).
const PROD_UNIT_ID = 'ca-app-pub-4240393056142568/8472712881';
const UNIT_ID = __DEV__ ? TestIds.BANNER : PROD_UNIT_ID;

/**
 * A single, gentle anchored adaptive banner, shown once just above the tab bar for
 * free users and hidden for Astropanth Plus subscribers. No interstitials or video
 * anywhere. The web build uses AdBanner.web.tsx (a no-op) so this native-only ads
 * module is never bundled for web.
 */
export default function AdBanner() {
  const { isPremium, isLoading } = usePremium();
  // v1 iOS launches ad-free (skips AdMob-iOS + App Tracking Transparency review
  // friction). Remove this guard once an iOS AdMob app id + ATT flow are set up.
  if (Platform.OS === 'ios') return null;
  if (isLoading || isPremium) return null; // ad-free for Plus; wait until known

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#13102A', // matches the tab bar so it blends
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 200, 126, 0.12)',
  },
});
