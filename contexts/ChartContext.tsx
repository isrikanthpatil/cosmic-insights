import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, Profile, isProfileComplete } from '@/contexts/AuthContext';

const GUEST_PROFILE_KEY = 'guest_profile';
const SAVED_CHARTS_KEY = 'saved_charts_v1';

/** A chart the user has saved to view again (family, friends, etc.). */
export interface SavedChart {
  id: string;
  profile: Profile;
}

/** Stable identity for de-duping saved charts: name + date of birth. */
function chartKey(p: Profile): string {
  return `${p.firstName.trim().toLowerCase()}|${p.lastName.trim().toLowerCase()}|${p.dateOfBirth.trim()}`;
}

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
  /** Charts the user has saved on this device (family, friends, etc.). */
  savedCharts: SavedChart[];
  /** Save a chart (de-duped by name + DOB). Returns the saved entry. */
  saveChart: (p: Profile) => SavedChart;
  /** Remove a saved chart by id. */
  deleteChart: (id: string) => void;
  /** True when the given profile is already saved. */
  isChartSaved: (p: Profile) => boolean;
}

const ChartContext = createContext<ChartContextValue | undefined>(undefined);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile, user } = useAuth();
  const [override, setOverride] = useState<Profile | null>(null);
  const [guestProfile, setGuestProfileState] = useState<Profile | null>(null);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);

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

  // Hydrate saved charts once on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVED_CHARTS_KEY);
        if (mounted && raw) setSavedCharts(JSON.parse(raw) as SavedChart[]);
      } catch {
        // ignore — empty list
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistCharts = (list: SavedChart[]) => {
    setSavedCharts(list);
    AsyncStorage.setItem(SAVED_CHARTS_KEY, JSON.stringify(list)).catch(() => {});
  };

  const setGuestProfile = (p: Profile) => {
    setGuestProfileState(p);
    AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(p)).catch(() => {});
  };

  const saveChart = (p: Profile): SavedChart => {
    const key = chartKey(p);
    const existing = savedCharts.find((c) => chartKey(c.profile) === key);
    if (existing) return existing;
    const entry: SavedChart = { id: `${key}|${Date.now()}`, profile: p };
    persistCharts([...savedCharts, entry]);
    return entry;
  };

  const deleteChart = (id: string) => {
    persistCharts(savedCharts.filter((c) => c.id !== id));
  };

  const isChartSaved = (p: Profile) => {
    const key = chartKey(p);
    return savedCharts.some((c) => chartKey(c.profile) === key);
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
    savedCharts,
    saveChart,
    deleteChart,
    isChartSaved,
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
