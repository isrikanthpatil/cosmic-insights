import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, Profile, isProfileComplete } from '@/contexts/AuthContext';

const GUEST_PROFILE_KEY = 'guest_profile';

interface ChartContextValue {
  /** The profile that should drive readings: explored chart, else the user's
   *  own, else the locally-saved guest profile. */
  activeProfile: Profile | null;
  /** True when the user is temporarily viewing someone else's chart. */
  isExploring: boolean;
  /** The other person's details being explored (null when viewing own chart). */
  exploreSubject: Profile | null;
  /** Temporarily view another person's chart (in-memory only). */
  setExplore: (p: Profile) => void;
  /** Return to the user's own chart. */
  clearExplore: () => void;
  /** A locally-persisted profile for guests (no account). */
  guestProfile: Profile | null;
  /** Persist a guest profile so readings render without an account. */
  setGuestProfile: (p: Profile) => void;
  /** True when there is no authenticated profile (browsing as a guest). */
  isGuest: boolean;
  /** True when signed in but the account has no birth details yet (e.g. a fresh
   *  Google sign-in). Screens use this to prompt for details instead of showing
   *  a fabricated chart. */
  needsProfileDetails: boolean;
}

const ChartContext = createContext<ChartContextValue | undefined>(undefined);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile, user } = useAuth();
  const [override, setOverride] = useState<Profile | null>(null);
  const [guestProfile, setGuestProfileState] = useState<Profile | null>(null);

  // Clear any transient "explore another chart" override whenever the signed-in
  // identity changes (login OR logout). Otherwise a stranger's chart would keep
  // driving every screen after an auth transition (Home has no ExploreBar to
  // reveal it), silently showing the wrong person's reading.
  useEffect(() => {
    setOverride(null);
  }, [user?.id]);

  // Hydrate the guest profile from AsyncStorage once on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
        if (mounted && raw) {
          setGuestProfileState(JSON.parse(raw) as Profile);
        }
      } catch {
        // Ignore read/parse errors; guest profile simply stays null.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Once the user logs in, the authenticated profile takes precedence. Clear
  // the local guest copy so it can't shadow or get out of sync.
  useEffect(() => {
    if (authProfile && guestProfile) {
      setGuestProfileState(null);
      AsyncStorage.removeItem(GUEST_PROFILE_KEY).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authProfile]);

  const setGuestProfile = (p: Profile) => {
    setGuestProfileState(p);
    AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(p)).catch(() => {});
  };

  // A signed-in account with no birth date can't drive a reading, so it must not
  // be treated as the active profile (that would compute a chart from an empty
  // date). Fall through to the guest profile only when not signed in.
  const usableAuthProfile = isProfileComplete(authProfile) ? authProfile : null;

  const value: ChartContextValue = {
    activeProfile: override ?? usableAuthProfile ?? guestProfile,
    isExploring: override !== null,
    exploreSubject: override,
    setExplore: (p: Profile) => setOverride(p),
    clearExplore: () => setOverride(null),
    guestProfile,
    setGuestProfile,
    isGuest: !authProfile,
    needsProfileDetails: !!authProfile && !isProfileComplete(authProfile) && override === null,
  };

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}

export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return ctx;
}
