import mobileAds from 'react-native-google-mobile-ads';

/** Initialize the Google Mobile Ads SDK (native only). */
export function initMobileAds(): void {
  try {
    mobileAds().initialize();
  } catch {
    // SDK unavailable (e.g. Expo Go) — banners simply won't render.
  }
}
