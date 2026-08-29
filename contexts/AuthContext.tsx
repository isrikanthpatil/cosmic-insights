import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * A profile is only usable for a reading once it has a birth date — the field
 * every sidereal calculation depends on. Google sign-in creates an account with
 * an email but no birth details, so we must gate on this rather than merely
 * "is there a profile object", otherwise we'd compute a chart from an empty date.
 */
export function isProfileComplete(p: Profile | null): boolean {
  return !!(p && p.dateOfBirth);
}

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
    let mounted = true;

    // React to login/logout (and async store hydration) so the UI updates.
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (mounted) setUser(record ?? null);
    });

    // AsyncAuthStore hydrates from AsyncStorage asynchronously. Reading the
    // same key ourselves resolves after that hydration, so by the time this
    // promise settles the store has populated its record (if a saved session
    // exists). This avoids briefly showing the login screen to a logged-in
    // user on cold start.
    const finish = () => {
      if (!mounted) return;
      setUser(pb.authStore.record ?? null);
      setIsLoading(false);
    };

    AsyncStorage.getItem('pb_auth')
      .then(async () => {
        if (!mounted) return;

        // Validate the restored session. A saved token can be EXPIRED (PocketBase
        // tokens lapse after ~2 weeks): the record still hydrates, so the app
        // would think it's logged in while every request 401s and the login modal
        // auto-dismisses. Clear a locally-expired session outright; otherwise
        // confirm with the server, but only log out on a definitive rejection
        // (401/403) — never on a timeout/offline, so travellers keep their session.
        if (pb.authStore.record) {
          if (!pb.authStore.isValid) {
            pb.authStore.clear();
          } else {
            try {
              await Promise.race([
                pb.collection('users').authRefresh(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
              ]);
            } catch (e: any) {
              if (e?.status === 401 || e?.status === 403) pb.authStore.clear();
              // network/timeout: keep the locally-valid session, proceed optimistically
            }
          }
        }
        finish();
      })
      .catch(() => finish()); // never leave the app stuck on a blank loading screen

    return () => {
      mounted = false;
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
      emailVisibility: false,
      ...profile,
    });
    await pb.collection('users').authWithPassword(email, password);
    // Send a verification email (best-effort: don't block signup if mail fails).
    try {
      await pb.collection('users').requestVerification(email);
    } catch (e) {
      console.warn('Verification email could not be sent:', e);
    }
  };

  const requestPasswordReset = async (email: string) => {
    await pb.collection('users').requestPasswordReset(email);
  };

  const updateProfile = async (profile: Profile) => {
    const id = pb.authStore.record!.id;
    const updated = await pb.collection('users').update(id, profile);
    // Write back into the auth store (not just React state) so a later
    // authRefresh can't silently revert the freshly-saved fields. The
    // authStore.onChange listener updates `user` for us.
    pb.authStore.save(pb.authStore.token, updated);
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
    requestPasswordReset,
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
