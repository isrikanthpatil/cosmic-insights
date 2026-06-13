import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/utils/pocketbase';

export type Profile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender: 'male' | 'female';
};

interface AuthContextValue {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Profile) => Promise<void>;
  signOut: () => void;
  updateProfile: (profile: Profile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toProfile(record: any | null): Profile | null {
  if (!record) return null;
  return {
    firstName: record.firstName ?? '',
    lastName: record.lastName ?? '',
    dateOfBirth: record.dateOfBirth ?? '',
    timeOfBirth: record.timeOfBirth ?? '',
    placeOfBirth: record.placeOfBirth ?? '',
    gender: (record.gender === 'female' ? 'female' : 'male') as 'male' | 'female',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // React to login/logout (and async store hydration) so the UI updates.
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record ?? null);
    });

    // AsyncAuthStore loads asynchronously; wait a tick for it to hydrate,
    // then read the current record and finish loading.
    const timer = setTimeout(() => {
      setUser(pb.authStore.record ?? null);
      setIsLoading(false);
    }, 0);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
  };

  const signUp = async (email: string, password: string, profile: Profile) => {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      emailVisibility: true,
      ...profile,
    });
    await pb.collection('users').authWithPassword(email, password);
  };

  const updateProfile = async (profile: Profile) => {
    const id = pb.authStore.record!.id;
    const updated = await pb.collection('users').update(id, profile);
    setUser(updated);
  };

  const signOut = () => {
    pb.authStore.clear();
  };

  const value: AuthContextValue = {
    user,
    profile: toProfile(user),
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
