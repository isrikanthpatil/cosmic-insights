import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { pb } from '@/utils/pocketbase';

// Precise birthplace coordinates, resolved from the PocketBase `places`
// collection's lat/lon (populated by the GeoNames import) so the Lagna
// (ascendant) is accurate instead of falling back to a state centroid.
//
// Design: a synchronous in-memory cache that `getCoordinatesForPlace` reads
// first. We resolve a place asynchronously (network), store the result in the
// cache + AsyncStorage, and bump a nonce so screens subscribed via
// `useCoordsNonce()` recompute. If a place has no coordinates (unmatched row, or
// the import hasn't run), we simply fall back to the existing city/state table —
// nothing breaks.

export type Coord = { latitude: number; longitude: number };

const cache = new Map<string, Coord>();
const inflight = new Set<string>();
const negative = new Set<string>(); // places confirmed to have no coords (skip refetch)
let nonce = 0;
const listeners = new Set<() => void>();
const STORE_KEY = 'place_coords_v1';

const norm = (p: string) => (p || '').trim();

/** Synchronous lookup of a precise coordinate, or null if not resolved yet. */
export function getCachedCoords(place?: string | null): Coord | null {
  if (!place) return null;
  return cache.get(norm(place)) ?? null;
}

function notify() {
  nonce++;
  listeners.forEach((l) => l());
}

let loaded = false;
/** Load the persisted coordinate cache once (called on module import). */
export async function loadPersistedCoords(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, Coord>;
      let n = 0;
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
          cache.set(k, v);
          n++;
        }
      }
      if (n) notify();
    }
  } catch {
    // ignore cache read errors
  }
}

async function persist() {
  try {
    const obj: Record<string, Coord> = {};
    cache.forEach((v, k) => {
      obj[k] = v;
    });
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(obj));
  } catch {
    // ignore cache write errors
  }
}

/**
 * Resolve a birthplace to precise coordinates from the `places` collection and
 * cache them. No-op if already cached, in flight, or known to have none. Safe to
 * call repeatedly (e.g. from a screen effect).
 */
export async function resolveAndCache(place?: string | null): Promise<void> {
  const key = norm(place || '');
  if (!key || cache.has(key) || inflight.has(key) || negative.has(key)) return;
  inflight.add(key);
  try {
    // Autocomplete stores "Name, State"; match on name (+ state when present).
    const parts = key.split(',').map((s) => s.trim()).filter(Boolean);
    const name = parts[0] || key;
    const state = parts.length > 1 ? parts[parts.length - 1] : '';
    // Unmatched rows keep PocketBase's default 0 (not null), so exclude 0 —
    // every Indian place has positive lat/lon.
    const filter = state
      ? pb.filter('name = {:n} && state = {:s} && lat != 0', { n: name, s: state })
      : pb.filter('name = {:n} && lat != 0', { n: name });
    const res = await pb.collection('places').getList(1, 1, {
      filter,
      skipTotal: true,
      requestKey: null, // don't auto-cancel; these can overlap harmlessly
    });
    const item: any = res.items?.[0];
    if (item && typeof item.lat === 'number' && item.lat !== 0 &&
        typeof item.lon === 'number' && item.lon !== 0) {
      cache.set(key, { latitude: item.lat, longitude: item.lon });
      notify();
      persist();
    } else {
      negative.add(key); // no coords for this place — use the fallback table
    }
  } catch {
    // Network/collection error — leave unmarked so a later call can retry.
  } finally {
    inflight.delete(key);
  }
}

/**
 * Subscribe to coordinate-cache updates. Returns a value that changes whenever a
 * place resolves, so chart `useMemo`s that include it in their deps recompute
 * with the newly-precise coordinates.
 */
export function useCoordsNonce(): number {
  const [, setN] = useState(0);
  useEffect(() => {
    const l = () => setN((x) => x + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return nonce;
}

// Prime from persisted storage as soon as this module is imported.
void loadPersistedCoords();
