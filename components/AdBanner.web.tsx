// Web has no ads (and the native ads module can't be bundled for web). Metro
// resolves this .web file for the web platform, so react-native-google-mobile-ads
// is never imported in the web build.
export default function AdBanner() {
  return null;
}
