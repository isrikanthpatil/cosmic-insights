import React, { createContext, useContext, useState } from 'react';
import { useAuth, Profile } from '@/contexts/AuthContext';

interface ChartContextValue {
  /** The profile that should drive readings: the explored chart if any, else the user's own. */
  activeProfile: Profile | null;
  /** True when the user is temporarily viewing someone else's chart. */
  isExploring: boolean;
  /** The other person's details being explored (null when viewing own chart). */
  exploreSubject: Profile | null;
  /** Temporarily view another person's chart (in-memory only). */
  setExplore: (p: Profile) => void;
  /** Return to the user's own chart. */
  clearExplore: () => void;
}

const ChartContext = createContext<ChartContextValue | undefined>(undefined);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile } = useAuth();
  const [override, setOverride] = useState<Profile | null>(null);

  const value: ChartContextValue = {
    activeProfile: override ?? authProfile,
    isExploring: override !== null,
    exploreSubject: override,
    setExplore: (p: Profile) => setOverride(p),
    clearExplore: () => setOverride(null),
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
