import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';

const store = new AsyncAuthStore({
  save:    async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
  initial: AsyncStorage.getItem('pb_auth'),
  clear:   async () => AsyncStorage.removeItem('pb_auth'),
});

const url = process.env.EXPO_PUBLIC_PB_URL ?? 'https://cosmicpatil.duckdns.org';
export const pb = new PocketBase(url, store);
