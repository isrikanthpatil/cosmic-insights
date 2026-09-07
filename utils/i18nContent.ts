import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { pb } from '@/utils/pocketbase';
import { bundleGet, localizeFromBundle } from '@/utils/contentBundle';

// Runtime translation for GENERATED content (readings, horoscopes, report HTML)
// — the dynamic prose that isn't in the bundled UI dictionaries. Calls the
// server /api/translate hook (Groq + server cache) and additionally caches every
// result on-device so a string is translated at most once per language, ever.
//
// English is a pure pass-through (no network). Anything that can't be translated
// falls back to the English source, so the UI never breaks.

const SUPPORTED = new Set(['hi', 'mr', 'kn', 'ta', 'te']);
const mem = new Map<string, string>();            // `${lang}:${hash}` -> translation
const CACHE_PREFIX = 'txc2_';                       // AsyncStorage key prefix (v2: only real translations cached)

// Global in-flight counter so the UI can show a subtle "translating…" indicator
// while generated content is being fetched (first view of uncached content).
let inflight = 0;
const inflightListeners = new Set<() => void>();
function setInflight(delta: number) {
  inflight = Math.max(0, inflight + delta);
  inflightListeners.forEach((l) => l());
}

// Stable string hash — MUST match the server hook's hash() so keys line up.
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
const cacheKey = (lang: string, src: string) => `${lang}:${hash(src)}`;

async function loadPersisted(lang: string, srcs: string[]): Promise<void> {
  const keys = srcs.map((s) => CACHE_PREFIX + cacheKey(lang, s));
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) {
      if (v != null) mem.set(k.slice(CACHE_PREFIX.length), v);
    }
  } catch {
    // ignore cache read errors
  }
}

async function persist(lang: string, entries: [string, string][]): Promise<void> {
  if (!entries.length) return;
  const kv: [string, string][] = entries.map(([src, tr]) => [
    CACHE_PREFIX + cacheKey(lang, src),
    tr,
  ]);
  try {
    await AsyncStorage.multiSet(kv);
  } catch {
    // ignore cache write errors
  }
}

/**
 * Translate a list of strings into `lang`, preserving order. Returns the English
 * input unchanged for `en`/unsupported languages or on any failure. Deduplicates,
 * uses the on-device + server caches, and only sends cache-misses to the server.
 */
export async function translateList(texts: string[], lang: string): Promise<string[]> {
  if (!SUPPORTED.has(lang) || texts.length === 0) return texts.slice();

  // Unique, non-trivial sources only.
  const unique = Array.from(
    new Set(texts.filter((t) => typeof t === 'string' && /[A-Za-z]/.test(t))),
  );
  await loadPersisted(lang, unique);

  // Bundled finite strings (terms, knowledge phrases, labeled reading lines) are
  // resolved offline/instantly and never sent to the server.
  const misses = unique.filter(
    (s) => !mem.has(cacheKey(lang, s)) && bundleGet(lang, s) == null,
  );

  // Translate misses in small chunks so each request returns quickly (the
  // server further splits these into tiny Groq calls for reliability).
  for (let i = 0; i < misses.length; i += 24) {
    const chunk = misses.slice(i, i + 24);
    setInflight(1);
    try {
      const res: any = await pb.send('/api/translate', {
        method: 'POST',
        body: { texts: chunk, lang },
      });
      const arr: (string | null)[] = res?.translations || [];
      const learned: [string, string][] = [];
      chunk.forEach((src, j) => {
        const tr = arr[j];
        // The server returns a result string for every item it processed (even a
        // proper noun that legitimately equals English) and `null` for an item it
        // could NOT translate. Cache any string — so proper nouns aren't
        // re-requested on every visit — and leave `null` a miss so genuine
        // failures retry next time (a transient failure can never stick English).
        if (typeof tr === 'string' && tr.trim()) {
          mem.set(cacheKey(lang, src), tr);
          learned.push([src, tr]);
        }
      });
      await persist(lang, learned);
    } catch {
      // Network/hook failure — leave these as misses (render English for now,
      // retry on the next call). Never cache English on failure.
    } finally {
      setInflight(-1);
    }
  }

  return texts.map((t) => {
    if (typeof t !== 'string' || !/[A-Za-z]/.test(t)) return t;
    // Offline bundle wins first, then the on-device/server cache, then English.
    return bundleGet(lang, t) ?? mem.get(cacheKey(lang, t)) ?? t;
  });
}

/** React hook: true while any generated content is being translated (for a
 *  subtle global "translating…" indicator). */
export function useTranslating(): boolean {
  const [busy, setBusy] = useState(inflight > 0);
  useEffect(() => {
    const l = () => setBusy(inflight > 0);
    inflightListeners.add(l);
    l();
    return () => {
      inflightListeners.delete(l);
    };
  }, []);
  return busy;
}

/** Convenience for a single string. */
export async function translateText(text: string, lang: string): Promise<string> {
  const [out] = await translateList([text], lang);
  return out ?? text;
}

// --- HTML (reports / forecast) --------------------------------------------
// Translate only the visible text nodes of an HTML document, leaving tags,
// attributes, <style>/<script> blocks, numbers and symbols untouched. This lets
// every generated report/forecast localize uniformly without rewriting the
// builders.
const PROTECT = /(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>)/gi;
const TEXTNODE = />([^<]+)</g;

export async function translateHtml(html: string, lang: string): Promise<string> {
  if (!SUPPORTED.has(lang) || !html) return html;

  // Split the doc into protected (style/script) and translatable segments.
  const segments = html.split(PROTECT);

  // Collect candidate text nodes across the non-protected segments.
  const candidates = new Set<string>();
  for (let s = 0; s < segments.length; s++) {
    if (s % 2 === 1) continue; // odd segments are the protected style/script
    let m: RegExpExecArray | null;
    TEXTNODE.lastIndex = 0;
    while ((m = TEXTNODE.exec(segments[s]))) {
      const raw = m[1];
      const trimmed = raw.trim();
      if (trimmed.length > 1 && /[A-Za-z]/.test(trimmed)) candidates.add(trimmed);
    }
  }
  if (candidates.size === 0) return html;

  const list = Array.from(candidates);
  const translated = await translateList(list, lang);
  const map = new Map<string, string>();
  list.forEach((src, i) => map.set(src, translated[i] ?? src));

  // Reinsert, preserving each node's original leading/trailing whitespace.
  for (let s = 0; s < segments.length; s++) {
    if (s % 2 === 1) continue;
    segments[s] = segments[s].replace(TEXTNODE, (full, inner) => {
      const trimmed = inner.trim();
      const tr = map.get(trimmed);
      if (!tr) return full;
      const lead = inner.slice(0, inner.indexOf(trimmed));
      const tail = inner.slice(inner.indexOf(trimmed) + trimmed.length);
      return '>' + lead + tr + tail + '<';
    });
  }
  return segments.join('');
}

/**
 * React hook: translate a list of strings for the current language. Returns the
 * English input immediately, then re-renders with translations when ready.
 */
export function useTranslatedList(texts: string[], lang: string): string[] {
  // Seed from the offline bundle so finite content is in-language on first paint.
  const [out, setOut] = useState<string[]>(() => localizeFromBundle(texts, lang));
  const key = `${lang}:${texts.length}:${texts.join('|')}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    let alive = true;
    if (!SUPPORTED.has(lang)) {
      setOut(texts);
      return;
    }
    setOut(localizeFromBundle(texts, lang)); // bundled instantly; prose still translating
    translateList(texts, lang).then((res) => {
      if (alive && keyRef.current === key) setOut(res);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return out;
}

/**
 * React hook that translates a batch of generated strings and returns a lookup
 * function `tx(englishString)` → localized string (or the input unchanged for
 * `en`/unknown or until translation arrives). Ergonomic for screens that render
 * many generated prose nodes: gather them once, then wrap each render site.
 */
export function useTranslatedMap(texts: string[], lang: string): (s: string) => string {
  const values = useTranslatedList(texts, lang);
  const map = new Map<string, string>();
  texts.forEach((t, i) => {
    if (typeof t === 'string') map.set(t, values[i] ?? t);
  });
  return (s: string) => (typeof s === 'string' ? map.get(s) ?? s : s);
}

/** React hook: translate an HTML document for the current language. */
export function useTranslatedHtml(html: string, lang: string): { html: string; loading: boolean } {
  const [out, setOut] = useState(html);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!SUPPORTED.has(lang) || !html) {
      setOut(html);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOut(html);
    translateHtml(html, lang).then((res) => {
      if (alive) {
        setOut(res);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [html, lang]);

  return { html: out, loading };
}
