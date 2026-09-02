import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PROVIDER-AGNOSTIC entitlement layer.
//
// This context is the single source of truth for whether the user has the
// "Astropanth Plus" entitlement. Call sites only ever read `isPremium` via
// `usePremium()` — they never know *where* the entitlement comes from.
//
// Today the entitlement is sourced from a local AsyncStorage flag
// (`premium_entitlement`). When a real billing provider is chosen
// (Google Play Billing / RevenueCat / Razorpay / server check), only
// `readEntitlement()` below needs to change — every screen that calls
// `usePremium()` keeps working unchanged.
export const PREMIUM_ENTITLEMENT_KEY = 'premium_entitlement';

interface PremiumContextValue {
  /** True when the user has the Astropanth Plus entitlement. */
  isPremium: boolean;
  /** True while the entitlement is being (re)loaded. */
  isLoading: boolean;
  /** Re-read the entitlement from its source. */
  refresh: () => Promise<void>;
  /** Grant the entitlement locally. Permanent by default, or until `untilMs`
   *  (epoch ms) for time-limited grants such as a promo-code trial. Real
   *  billing (Razorpay / Play) will call this on a verified purchase. */
  grant: (untilMs?: number) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

// The ONLY place that knows how an entitlement is sourced. Swap the body of
// this function later for a RevenueCat / server / store check — the return
// type (a boolean) and every consumer stays the same.
// Stored value is either 'true' (permanent) or JSON {"until": <epoch ms>}.
async function readEntitlement(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PREMIUM_ENTITLEMENT_KEY);
    if (!raw) return false;
    if (raw === 'true') return true;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.until === 'number') return Date.now() < parsed.until;
    return false;
  } catch {
    // On any read error, fail closed (treat as free).
    return false;
  }
}

async function writeEntitlement(untilMs?: number): Promise<void> {
  const value = untilMs ? JSON.stringify({ until: untilMs }) : 'true';
  await AsyncStorage.setItem(PREMIUM_ENTITLEMENT_KEY, value);
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const entitled = await readEntitlement();
    setIsPremium(entitled);
    setIsLoading(false);
  }, []);

  const grant = useCallback(async (untilMs?: number) => {
    try {
      await writeEntitlement(untilMs);
      setIsPremium(true);
    } catch {
      // ignore write failure; user can retry
    }
  }, []);

  // Load the entitlement once on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const entitled = await readEntitlement();
      if (mounted) {
        setIsPremium(entitled);
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value: PremiumContextValue = {
    isPremium,
    isLoading,
    refresh,
    grant,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return ctx;
}
