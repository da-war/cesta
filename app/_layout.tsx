import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { configureRC, getCustomer, isPro, logoutRC } from '@/lib/revenuecat';
import { isCzechVoiceAvailable, platformVoiceHint } from '@/lib/speech';
import { refreshDailyReminders, requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';
import type { Profile } from '@/lib/database.types';
import { LEGAL_VERSIONS } from '@/lib/company';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap />
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="lesson/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="legal/privacy" options={{ presentation: 'modal', headerShown: true, title: 'Privacy Policy' }} />
            <Stack.Screen name="legal/terms" options={{ presentation: 'modal', headerShown: true, title: 'Terms & Conditions' }} />
            <Stack.Screen name="legal/contact" options={{ presentation: 'modal', headerShown: true, title: 'Contact Us' }} />
            <Stack.Screen name="legal/delete-account" options={{ presentation: 'modal', headerShown: true, title: 'Delete Account' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthBootstrap() {
  const { setSession, setProfile, setProEntitled, setReady, reset } = useAppStore();
  const segments = useSegments();
  const sessionFromStore = useAppStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const ready = useAppStore((s) => s.isReady);
  const voiceCheckedRef = useRef(false);

  // Reschedule daily reminders whenever profile changes (toggles, goal completion, etc).
  // Only fires when we have a profile and permission is already granted.
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const perm = await getNotificationPermission();
      if (perm !== 'granted') return;
      const today = new Date().toISOString().slice(0, 10);
      const { data: act } = await supabase
        .from('user_daily_activity')
        .select('goal_met')
        .eq('user_id', profile.id)
        .eq('activity_date', today)
        .maybeSingle();
      await refreshDailyReminders(profile, act?.goal_met ?? false);
    })().catch(() => {});
  }, [
    profile?.id,
    profile?.notif_streak_enabled,
    profile?.notif_morning_enabled,
    profile?.notif_afternoon_enabled,
    profile?.notif_evening_enabled,
    profile?.streak_days,
  ]);

  // One-time check after bootstrap: warn Android users if Czech TTS voice missing.
  useEffect(() => {
    if (!ready || voiceCheckedRef.current) return;
    if (Platform.OS !== 'android') { voiceCheckedRef.current = true; return; }
    voiceCheckedRef.current = true;
    isCzechVoiceAvailable().then((available) => {
      if (!available) {
        Alert.alert(
          'Install Czech voice',
          `For the best pronunciation, install the Czech TTS voice:\n\n${platformVoiceHint()}\n\nYou can use Cesta without it, but words will sound off.`,
          [{ text: 'Got it' }]
        );
      }
    }).catch(() => {});
  }, [ready]);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      if (session?.user) await loadProfileAndRC(session.user.id, setProfile, setProEntitled);
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
    bootstrap();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfileAndRC(session.user.id, setProfile, setProEntitled);
      } else if (event === 'SIGNED_OUT') {
        await logoutRC(); reset();
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Routing guard. Runs each time session/profile/route segments change.
  // Each action screen (age-gate, consent, placement) must reload the profile
  // BEFORE navigating, so the guard sees fresh state.
  useEffect(() => {
    if (!ready) return;
    const group = segments[0] as string | undefined;
    const inAuth = group === '(auth)';
    const inLegal = group === 'legal';

    if (inLegal) return; // legal pages are accessible from anywhere

    // No session → bounce to sign-in
    if (!sessionFromStore) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    // Session but profile hasn't loaded yet — wait
    if (!profile) return;

    // Compliance gates in order
    if (!profile.age_confirmed) {
      if (segments[1] !== 'age-gate') router.replace('/(auth)/age-gate');
      return;
    }
    const legalCurrent =
      profile.terms_accepted_version === LEGAL_VERSIONS.terms &&
      profile.privacy_accepted_version === LEGAL_VERSIONS.privacy;
    if (!legalCurrent) {
      if (segments[1] !== 'consent') router.replace('/(auth)/consent');
      return;
    }
    if (!profile.has_completed_placement) {
      if (segments[1] !== 'placement') router.replace('/(auth)/placement');
      return;
    }
    // All gates clear — if user is still in auth group, send them to tabs
    if (inAuth) router.replace('/(tabs)');
  }, [sessionFromStore, profile, segments, ready]);

  return null;
}

async function loadProfileAndRC(
  userId: string,
  setProfile: (p: Profile | null) => void,
  setProEntitled: (v: boolean) => void,
) {
  await supabase.rpc('maybe_refill_hearts').catch(() => {});
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  setProfile(profile as Profile | null);
  try {
    await configureRC(userId);
    const info = await getCustomer();
    setProEntitled(isPro(info));
  } catch (e) { console.warn('[rc]', e); }
}
