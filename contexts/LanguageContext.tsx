import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DICTS, Lang } from '@/i18n/strings';

const STORAGE_KEY = 'app_language_v1';

type Params = Record<string, string | number>;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key for the current language (falls back to English, then the
   *  key). Supports {name}-style interpolation via `params`. */
  t: (key: string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function interpolate(str: string, params?: Params): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    (async () => {
      try {
        const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
        if (saved === 'en' || saved === 'hi' || saved === 'mr') setLangState(saved);
      } catch {}
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const dict = DICTS[lang] || DICTS.en;
      const val = dict[key] ?? DICTS.en[key] ?? key;
      return interpolate(val, params);
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
