const { withAndroidManifest } = require('@expo/config-plugins');

const AD_ID = 'com.google.android.gms.permission.AD_ID';

/**
 * Explicitly add the Google Advertising ID permission to AndroidManifest.xml.
 * AdMob (react-native-google-mobile-ads) needs this to match the Play Console
 * "app uses advertising ID" declaration; the `android.permissions` app-config
 * array does not reliably inject this fully-qualified Google permission, so we
 * write it directly and strip any `tools:node="remove"` marker a dependency may
 * have added for the same permission.
 */
module.exports = function withAdIdPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = [];
    }
    // Remove any existing entry (including a tools:node="remove" one) so ours wins.
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      (p) => p?.$?.['android:name'] !== AD_ID
    );
    manifest['uses-permission'].push({ $: { 'android:name': AD_ID } });
    return cfg;
  });
};
