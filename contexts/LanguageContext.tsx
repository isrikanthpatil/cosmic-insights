import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pb } from '@/utils/pocketbase';
import { DICTS, LANGUAGES, Lang } from '@/i18n/strings';
import { LOCALIZATION_ENABLED } from '@/constants/plans';

// Localization engine. English (+ Hindi/Marathi) ship in the app as an offline
// fallback. Additional languages and edits are served over-the-air from two
// PocketBase collections, so adding e.g. Kannada is just admin rows — NO rebuild:
//   • `languages`     — { code, native, label, sort, active }  (drives the picker)
//   • `translations`  — { lang, key, value }                    (the strings)
// Fetched strings override bundled ones; everything is cached locally so the app
// works offline and instantly on launch. If the collections don't exist yet,
// the app silently falls back to the bundled dictionaries.
const STORAGE_KEY = 'app_language_v1';
const CACHE_LANGS = 'i18n_langs_v2';
const cacheDictKey = (l: string) => `i18n_dict_${l}_v2`;

type Params = Record<string, string | number>;
export type LangOption = { code: string; native: string; label: string };

interface LanguageContextValue {
  lang: string;
  setLang: (l: string) => void;
  availableLangs: LangOption[];
  t: (key: string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function interpolate(str: string, params?: Params): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}

// Merge server languages into the bundled list (bundled first, then any new ones).
function mergeLangs(server: LangOption[]): LangOption[] {
  const out: LangOption[] = LANGUAGES.map((l) => ({ code: l.code, native: l.native, label: l.label }));
  for (const s of server) {
    if (s.code && !out.some((o) => o.code === s.code)) out.push(s);
  }
  return out;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>('en');
  // While localization is gated off, expose English only so the picker stays
  // hidden and nothing switches. When enabled, start from the bundled list and
  // merge server languages on top.
  const [availableLangs, setAvailableLangs] = useState<LangOption[]>(
    LOCALIZATION_ENABLED
      ? LANGUAGES.map((l) => ({ code: l.code, native: l.native, label: l.label }))
      : [{ code: 'en', native: 'English', label: 'English' }],
  );
  // Fetched string overrides per language (merged over the bundled dictionaries).
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});

  // Load the saved language + any cached data immediately (offline-first).
  useEffect(() => {
    // Localization gated off: stay in English, skip all saved/server loading.
    if (!LOCALIZATION_ENABLED) return;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const cur = saved || 'en';
        setLangState(cur);
        const cachedLangs = await AsyncStorage.getItem(CACHE_LANGS);
        if (cachedLangs) setAvailableLangs(mergeLangs(JSON.parse(cachedLangs)));
        const cachedDict = await AsyncStorage.getItem(cacheDictKey(cur));
        if (cachedDict) setOverrides((p) => ({ ...p, [cur]: JSON.parse(cachedDict) }));
      } catch {}
      // Then refresh from the server in the background.
      refreshLanguages();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshLanguages = useCallback(async () => {
    try {
      const rows: any[] = await pb.collection('languages').getFullList({ sort: 'sort', filter: 'active = true' });
      const server: LangOption[] = rows.map((r) => ({ code: r.code, native: r.native, label: r.label || r.native }));
      setAvailableLangs(mergeLangs(server));
      AsyncStorage.setItem(CACHE_LANGS, JSON.stringify(server)).catch(() => {});
    } catch {
      // collection may not exist yet — bundled languages remain
    }
  }, []);

  const fetchTranslations = useCallback(async (l: string) => {
    if (l === 'en') return; // English is the bundled source of truth
    try {
      const rows: any[] = await pb.collection('translations').getFullList({ filter: pb.filter('lang = {:l}', { l }) });
      if (!rows.length) return;
      const d: Record<string, string> = {};
      for (const r of rows) if (r.key) d[r.key] = r.value;
      setOverrides((p) => ({ ...p, [l]: d }));
      AsyncStorage.setItem(cacheDictKey(l), JSON.stringify(d)).catch(() => {});
    } catch {
      // offline or no collection — bundled/cached dict is used
    }
  }, []);

  // Whenever the language changes, make sure its server strings are loaded.
  useEffect(() => { fetchTranslations(lang); }, [lang, fetchTranslations]);

  const setLang = useCallback((l: string) => {
    if (!LOCALIZATION_ENABLED) return; // locked to English until localization ships
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const bundled = (DICTS as Record<string, Record<string, string>>)[lang];
      const over = overrides[lang];
      const val = over?.[key] ?? bundled?.[key] ?? DICTS.en[key] ?? key;
      return interpolate(val, params);
    },
    [lang, overrides],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, availableLangs, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

export type { Lang };
