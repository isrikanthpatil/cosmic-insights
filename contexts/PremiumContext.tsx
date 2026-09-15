import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pb } from '@/utils/pocketbase';

// PROVIDER-AGNOSTIC entitlement layer.
//
// Single source of truth for the signed-in user's entitlements. Two scopes:
//   • plus    — the full "Astropanth Plus" (ad-free + all reports + unlimited)
//   • reports — access to the detailed reports ONLY (ads stay on)
// `plus` implies `reports`. Call sites read `isPremium` (ad-free / full) or
// `hasReports` (report access) — they never know where the entitlement came from.
//
// IMPORTANT: entitlements are scoped to the *authenticated user*, and are keyed by
// the user id in local storage. They are re-evaluated whenever the auth user
// changes (login / logout / account switch), so one user can never inherit
// another user's Plus on a shared device/browser. Guests (no account) have no
// entitlement. Promo codes and (soon) verified purchases grant to the current user.
//
// NOTE (next phase, with real billing): make entitlement authoritative by reading
// it from the server `purchases` ledger via a `/api/entitlement` hook, instead of
// local per-user flags. See LEGAL_COMPLIANCE / PLAY_BILLING docs.

const PLUS_BASE = 'premium_entitlement';   // plus
const REPORTS_BASE = 'reports_entitlement'; // reports-only

export type EntitlementScope = 'plus' | 'reports';

interface PremiumContextValue {
  /** Full Plus — ad-free + everything. */
  isPremium: boolean;
  /** Report access (true if a reports code/purchase OR full Plus). */
  hasReports: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  /** Grant an entitlement to the CURRENT user. Permanent by default, or until
   *  `untilMs` (epoch ms) for time-limited grants such as a promo trial. No-op for
   *  guests (there is no account to attach the entitlement to). */
  grant: (scope: EntitlementScope, untilMs?: number) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

/** The signed-in user's id, or null for guests. */
function currentUid(): string | null {
  try {
    return pb.authStore.isValid ? (pb.authStore.record?.id ?? null) : null;
  } catch {
    return null;
  }
}

/** Per-user storage key, or null if there is no signed-in user. */
function keyFor(base: string, uid: string | null): string | null {
  return uid ? `${base}:${uid}` : null;
}

// Stored value is either 'true' (permanent) or JSON {"until": <epoch ms>}.
async function readFlag(key: string | null): Promise<boolean> {
  if (!key) return false;
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

// One-time cleanup: earlier builds stored entitlement under GLOBAL (non-user)
// keys, which leaked Plus across accounts on a shared device. Remove them so they
// can never be read again; entitlement is now strictly per-user.
async function purgeLegacyGlobalFlags(): Promise<void> {
  try { await AsyncStorage.multiRemove([PLUS_BASE, REPORTS_BASE]); } catch { /* ignore */ }
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [hasReports, setHasReports] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const uid = currentUid();
    const [plus, reports] = await Promise.all([
      readFlag(keyFor(PLUS_BASE, uid)),
      readFlag(keyFor(REPORTS_BASE, uid)),
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
    const uid = currentUid();
    const key = keyFor(scope === 'plus' ? PLUS_BASE : REPORTS_BASE, uid);
    if (!key) return; // no signed-in user → nothing to attach the entitlement to
    try {
      await writeFlag(key, untilMs);
      await load();
    } catch {
      // ignore; user can retry
    }
  }, [load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await purgeLegacyGlobalFlags();
      await load();
      if (mounted) setIsLoading(false);
    })();
    // Re-evaluate entitlement whenever the auth user changes (login / logout /
    // account switch), so premium never carries over between users.
    const unsubscribe = pb.authStore.onChange(() => { if (mounted) load(); });
    return () => { mounted = false; unsubscribe(); };
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
