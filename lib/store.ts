import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './database.types';

interface AppState {
  session: Session | null;
  profile: Profile | null;
  isProEntitled: boolean;
  isReady: boolean;
  setSession: (s: Session | null) => void;
  setProfile: (p: Profile | null) => void;
  setProEntitled: (v: boolean) => void;
  setReady: (v: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null, profile: null, isProEntitled: false, isReady: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setProEntitled: (isProEntitled) => set({ isProEntitled }),
  setReady: (isReady) => set({ isReady }),
  reset: () => set({ session: null, profile: null, isProEntitled: false }),
}));

export const useSession = () => useAppStore((s) => s.session);
export const useProfile = () => useAppStore((s) => s.profile);
export const useIsPro = () => useAppStore((s) => s.isProEntitled);
