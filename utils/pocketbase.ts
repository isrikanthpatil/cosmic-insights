import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';
import RNEventSource from 'react-native-sse';

// PocketBase's all-in-one OAuth2 (authWithOAuth2) receives the auth code back
// over a realtime SSE connection, which relies on a global `EventSource`.
// React Native / Hermes has no built-in EventSource, so we polyfill it with a
// pure-JS (XHR-based) implementation. This is what lets "Continue with Google"
// work on Android, not just web. Pure JS — no native module / config plugin.
if (typeof (global as any).EventSource === 'undefined') {
  (global as any).EventSource = RNEventSource;
}

const store = new AsyncAuthStore({
  save:    async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
  initial: AsyncStorage.getItem('pb_auth'),
  clear:   async () => AsyncStorage.removeItem('pb_auth'),
});

const url = process.env.EXPO_PUBLIC_PB_URL ?? 'https://api.astropanth.com';
export const pb = new PocketBase(url, store);
