import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { usePremium } from '@/contexts/PremiumContext';

// The ads SDK is a native module with no web implementation, so require it lazily
// and only off-web — importing it statically would break the web (Netlify) bundle.
let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;
if (Platform.OS !== 'web') {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

// Real unit in production; Google's test unit in dev (never click your own live ads).
const PROD_UNIT_ID = 'ca-app-pub-4240393056142568/8472712881';
const UNIT_ID = __DEV__ && TestIds ? TestIds.BANNER : PROD_UNIT_ID;

/**
 * A single, gentle anchored adaptive banner. Rendered once just above the tab bar
 * for free users; hidden entirely for Astropanth Plus subscribers and on web.
 * No interstitials or video anywhere — we never push the user out of the flow.
 */
export default function AdBanner() {
  const { isPremium, isLoading } = usePremium();

  if (Platform.OS === 'web' || !BannerAd) return null;
  if (isLoading || isPremium) return null; // ad-free for Plus; wait until known

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
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
