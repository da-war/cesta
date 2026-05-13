import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useProfile, useIsPro, useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { CefrChip } from '@/components/gamification/CefrChip';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { palette, spacing, font, radius } from '@/lib/theme';
import { getTrackingStatus, requestTrackingPermission, type TrackingStatus } from '@/lib/tracking';
import { getNotificationPermission, requestNotificationPermission, REMINDER_SLOTS } from '@/lib/notifications';
import { logoutRC, restorePurchases } from '@/lib/revenuecat';
import { cancelAllReminders } from '@/lib/notifications';
import { COMPANY } from '@/lib/company';

export default function ProfileScreen() {
  const profile = useProfile();
  const isPro = useIsPro();
  const setProfile = useAppStore((s) => s.setProfile);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('undetermined');
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => { getTrackingStatus().then(setTrackingStatus); }, []);
  useEffect(() => { getNotificationPermission().then(setNotifStatus); }, []);

  if (!profile) return null;

  const toggleConsent = async (type: 'marketing' | 'analytics', value: boolean) => {
    await supabase.rpc('record_consent', { p_type: type, p_granted: value });
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (data) setProfile(data);
  };

  const toggleNotif = async (field: 'notif_streak_enabled' | 'notif_morning_enabled' | 'notif_afternoon_enabled' | 'notif_evening_enabled', value: boolean) => {
    // If turning ANY toggle on but we don't have permission, ask first
    if (value && notifStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      const newStatus = granted ? 'granted' : 'denied';
      setNotifStatus(newStatus);
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable them in Settings to receive daily reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => { if (Platform.OS === 'ios') Linking.openURL('app-settings:').catch(() => {}); } },
          ]
        );
        return;
      }
    }
    await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id);
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (data) setProfile(data); // reload triggers reschedule in root layout
  };

  const updateGoal = async (goal: number) => {
    await supabase.from('profiles').update({ daily_goal_xp: goal }).eq('id', profile.id);
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await cancelAllReminders();
    await logoutRC();
    await supabase.auth.signOut();
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    Alert.alert(restored ? 'Restored' : 'Nothing to restore', restored ? 'Your Pro subscription is active.' : 'No active subscription found for this account.');
  };

  const openTrackingSettings = () => {
    if (Platform.OS === 'ios') Linking.openURL('app-settings:').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(profile.display_name ?? 'U').charAt(0).toUpperCase()}</Text></View>
          <Text style={styles.name}>{profile.display_name ?? 'Learner'}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <CefrChip level={profile.cefr_level} />
            <StreakFlame streak={profile.streak_days} compact />
          </View>
          <View style={styles.statRow}>
            <Stat label="Total XP" value={profile.xp} />
            <Stat label="Longest streak" value={profile.longest_streak} />
            <Stat label="League" value={profile.league.toUpperCase()} />
          </View>
        </View>

        <Section title="Subscription">
          <Row label={isPro ? 'Cesta Pro · Active' : 'Free plan'} value="" />
          {!isPro ? (
            <Button label="Get Pro" variant="primary" size="md" onPress={() => router.push('/paywall')} />
          ) : null}
          <Pressable style={styles.linkRow} onPress={handleRestore}>
            <Text style={styles.linkText}>Restore purchases</Text>
          </Pressable>
        </Section>

        <Section title="Daily goal">
          <View style={styles.goalRow}>
            {[10, 30, 50, 100].map((g) => (
              <Pressable key={g} onPress={() => updateGoal(g)} style={[styles.goalChip, profile.daily_goal_xp === g && styles.goalChipOn]}>
                <Text style={[styles.goalChipText, profile.daily_goal_xp === g && { color: '#fff' }]}>{g} XP</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Daily reminders">
          <ToggleRow
            label="Reminders on"
            value={profile.notif_streak_enabled}
            onChange={(v) => toggleNotif('notif_streak_enabled', v)}
          />
          {profile.notif_streak_enabled && (
            <>
              {REMINDER_SLOTS.map((slot) => {
                const field = `notif_${slot.key}_enabled` as 'notif_morning_enabled' | 'notif_afternoon_enabled' | 'notif_evening_enabled';
                return (
                  <ToggleRow
                    key={slot.key}
                    label={`${slot.emoji}  ${slot.label}`}
                    value={profile[field]}
                    onChange={(v) => toggleNotif(field, v)}
                  />
                );
              })}
            </>
          )}
          {notifStatus === 'denied' && (
            <View style={styles.notifWarn}>
              <Text style={styles.notifWarnText}>
                Notifications are blocked at the system level. Enable them in Settings.
              </Text>
              <Pressable onPress={() => { if (Platform.OS === 'ios') Linking.openURL('app-settings:').catch(() => {}); }}>
                <Text style={styles.notifWarnLink}>Open Settings →</Text>
              </Pressable>
            </View>
          )}
        </Section>

        <Section title="Learning">
          <Pressable style={styles.linkRow} onPress={async () => {
            await supabase.from('profiles').update({ has_completed_placement: false }).eq('id', profile.id);
            const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
            if (data) setProfile(data);
            router.replace('/(auth)/placement');
          }}><Text style={styles.linkText}>Retake placement test</Text></Pressable>
        </Section>

        <Section title="Privacy">
          <ToggleRow label="Marketing emails" value={profile.marketing_consent} onChange={(v) => toggleConsent('marketing', v)} />
          <ToggleRow label="Anonymous analytics" value={profile.analytics_consent} onChange={(v) => toggleConsent('analytics', v)} />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.linkRow} onPress={async () => {
              if (trackingStatus === 'undetermined') {
                const s = await requestTrackingPermission(); setTrackingStatus(s);
              } else {
                openTrackingSettings();
              }
            }}>
              <Text style={styles.linkText}>App Tracking</Text>
              <Text style={styles.linkValue}>{trackingStatusLabel(trackingStatus)}</Text>
            </Pressable>
          )}
          <Pressable style={styles.linkRow} onPress={() => router.push('/legal/delete-account')}>
            <Text style={styles.linkText}>Export my data</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/legal/delete-account')}>
            <Text style={[styles.linkText, { color: palette.error }]}>Delete account</Text>
          </Pressable>
        </Section>

        <Section title="Legal">
          <Pressable style={styles.linkRow} onPress={() => router.push('/legal/privacy')}><Text style={styles.linkText}>Privacy Policy</Text></Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/legal/terms')}><Text style={styles.linkText}>Terms & Conditions</Text></Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/legal/contact')}><Text style={styles.linkText}>Contact us</Text></Pressable>
        </Section>

        <Section title="About">
          <Row label="Cesta" value="v0.1.0" />
          <Row label="Support" value={COMPANY.email} />
        </Section>

        <Button label="Sign out" variant="secondary" size="md" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function trackingStatusLabel(s: TrackingStatus): string {
  switch (s) {
    case 'granted': return 'Allowed';
    case 'denied': return 'Denied';
    case 'restricted': return 'Restricted';
    case 'undetermined': return 'Tap to choose';
    default: return 'Not applicable';
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.primary, false: palette.borderSoft }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  headerCard: { backgroundColor: palette.surfaceRaised, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: palette.border, alignItems: 'center', gap: spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: palette.ink },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.borderSoft },
  stat: { alignItems: 'center' },
  statValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink },
  statLabel: { fontSize: font.size.xs, color: palette.inkMuted, marginTop: 2 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: palette.inkMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.sm },
  sectionBody: { backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: palette.borderSoft },
  rowLabel: { fontSize: font.size.md, color: palette.ink, fontWeight: font.weight.medium },
  rowValue: { fontSize: font.size.md, color: palette.inkMuted },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: palette.borderSoft },
  linkText: { fontSize: font.size.md, color: palette.ink, fontWeight: font.weight.medium },
  linkValue: { fontSize: font.size.sm, color: palette.inkMuted },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  goalChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border },
  goalChipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  goalChipText: { fontSize: font.size.md, color: palette.ink, fontWeight: font.weight.semibold },
  notifWarn: { padding: spacing.md, backgroundColor: '#FFF8E6', gap: spacing.xs },
  notifWarnText: { fontSize: font.size.sm, color: palette.inkSoft, lineHeight: 18 },
  notifWarnLink: { fontSize: font.size.sm, color: palette.primary, fontWeight: font.weight.semibold },
});
