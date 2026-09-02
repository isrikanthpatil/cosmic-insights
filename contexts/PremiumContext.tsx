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
// Single source of truth for the user's entitlements. Two scopes:
//   • plus    — the full "Astropanth Plus" (ad-free + all reports + unlimited)
//   • reports — access to the detailed reports ONLY (ads stay on)
// `plus` implies `reports`. Call sites read `isPremium` (ad-free / full) or
// `hasReports` (report access) — they never know where the entitlement came from.
//
// Today entitlements are local AsyncStorage flags, granted by promo codes and
// (soon) by verified Razorpay / Play purchases. When real billing lands, only
// `readFlag()` / `grant()` change — every consumer keeps working.
export const PREMIUM_ENTITLEMENT_KEY = 'premium_entitlement'; // plus
export const REPORTS_ENTITLEMENT_KEY = 'reports_entitlement'; // reports-only

export type EntitlementScope = 'plus' | 'reports';

interface PremiumContextValue {
  /** Full Plus — ad-free + everything. */
  isPremium: boolean;
  /** Report access (true if a reports code/purchase OR full Plus). */
  hasReports: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  /** Grant an entitlement locally. Permanent by default, or until `untilMs`
   *  (epoch ms) for time-limited grants such as a promo trial. */
  grant: (scope: EntitlementScope, untilMs?: number) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

// Stored value is either 'true' (permanent) or JSON {"until": <epoch ms>}.
async function readFlag(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return false;
    if (raw === 'true') return true;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.until === 'number') return Date.now() < parsed.until;
    return false;
  } catch {
    return false; // fail closed
  }
}

async function writeFlag(key: string, untilMs?: number): Promise<void> {
  await AsyncStorage.setItem(key, untilMs ? JSON.stringify({ until: untilMs }) : 'true');
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [hasReports, setHasReports] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const [plus, reports] = await Promise.all([
      readFlag(PREMIUM_ENTITLEMENT_KEY),
      readFlag(REPORTS_ENTITLEMENT_KEY),
    ]);
    setIsPremium(plus);
    setHasReports(plus || reports); // plus implies reports
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await load();
    setIsLoading(false);
  }, [load]);

  const grant = useCallback(async (scope: EntitlementScope, untilMs?: number) => {
    try {
      await writeFlag(scope === 'plus' ? PREMIUM_ENTITLEMENT_KEY : REPORTS_ENTITLEMENT_KEY, untilMs);
      await load();
    } catch {
      // ignore; user can retry
    }
  }, [load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (mounted) setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, [load]);

  const value: PremiumContextValue = { isPremium, hasReports, isLoading, refresh, grant };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return ctx;
}
