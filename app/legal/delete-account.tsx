import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';
import { useProfile, useAppStore } from '@/lib/store';
import { logoutRC } from '@/lib/revenuecat';
import { cancelAllReminders } from '@/lib/notifications';

export default function DeleteAccountScreen() {
  const profile = useProfile();
  const setProfile = useAppStore((s) => s.setProfile);
  const [busy, setBusy] = useState(false);

  const isScheduled = profile?.deletion_scheduled_for != null;

  const handleExport = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('export_my_data');
    setBusy(false);
    if (error) { Alert.alert('Export failed', error.message); return; }
    try {
      await Share.share({
        title: 'My Cesta data',
        message: JSON.stringify(data, null, 2),
      });
    } catch {
      Alert.alert('Saved', 'Your data is ready. Copy it from the share sheet.');
    }
  };

  const handleSchedule = () => {
    Alert.alert(
      'Schedule deletion?',
      'Your account will be permanently deleted in 30 days. You can cancel anytime by signing in before then.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule deletion',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const { error } = await supabase.rpc('request_account_deletion');
            if (!error && profile) {
              const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
              if (data) setProfile(data);
            }
            setBusy(false);
            if (error) Alert.alert('Failed', error.message);
            else Alert.alert('Scheduled', 'Your account will be deleted in 30 days.');
          },
        },
      ]
    );
  };

  const handleCancelDeletion = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('cancel_account_deletion');
    if (!error && profile) {
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data);
    }
    setBusy(false);
    if (error) Alert.alert('Failed', error.message);
    else Alert.alert('Cancelled', 'Your account will not be deleted.');
  };

  const handleDeleteNow = () => {
    Alert.alert(
      'Delete immediately?',
      'This permanently erases your account, progress, streak, and all data. This cannot be undone.\n\nNote: subscriptions must be cancelled separately in the App Store or Play Store.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'There is no recovery after this.',
              [
                { text: 'Keep my account', style: 'cancel' },
                {
                  text: 'Yes, delete forever',
                  style: 'destructive',
                  onPress: async () => {
                    setBusy(true);
                    const { error } = await supabase.rpc('delete_my_account_now');
                    if (error) { setBusy(false); Alert.alert('Failed', error.message); return; }
                    await cancelAllReminders();
                    await logoutRC();
                    await supabase.auth.signOut();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Delete account</Text>
        <Text style={styles.body}>
          You can request your data, schedule deletion, or delete immediately. We respect your right
          to leave at any time.
        </Text>

        {isScheduled && (
          <View style={styles.scheduledBox}>
            <Text style={styles.scheduledTitle}>⚠️ Deletion scheduled</Text>
            <Text style={styles.scheduledBody}>
              Your account is scheduled for deletion on{'\n'}
              <Text style={styles.scheduledDate}>
                {new Date(profile!.deletion_scheduled_for!).toLocaleDateString()}
              </Text>
            </Text>
            <Button label="Cancel deletion" variant="secondary" size="md" onPress={handleCancelDeletion} loading={busy} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.h2}>1. Export your data</Text>
          <Text style={styles.sectionBody}>
            Download everything we have about you in JSON format. Includes profile, learning progress,
            streak history, and consent log.
          </Text>
          <Button label="Export my data" variant="secondary" size="md" onPress={handleExport} loading={busy} />
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>2. Schedule deletion (30 days)</Text>
          <Text style={styles.sectionBody}>
            We'll mark your account for deletion. If you sign in within 30 days, you can cancel.
            After that, your data is permanently erased.
          </Text>
          {!isScheduled && (
            <Button label="Schedule deletion in 30 days" variant="secondary" size="md" onPress={handleSchedule} loading={busy} />
          )}
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.h2Danger}>3. Delete immediately</Text>
          <Text style={styles.sectionBody}>
            Permanently delete your account and all data right now. This cannot be undone.
          </Text>
          <Text style={styles.warningNote}>
            ⚠️ <Text style={{ fontWeight: '700' }}>Cancel subscriptions separately</Text> in the App
            Store or Play Store — deleting your account here does not cancel them.
          </Text>
          <Button label="Delete account permanently" variant="danger" size="md" onPress={handleDeleteNow} loading={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  h1: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  h2: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink, marginBottom: spacing.xs },
  h2Danger: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.error, marginBottom: spacing.xs },
  body: { fontSize: font.size.md, color: palette.inkMuted, lineHeight: 22 },
  section: { backgroundColor: palette.surfaceRaised, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.sm },
  dangerSection: { backgroundColor: '#FFF5F5', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: '#FFCFCF', gap: spacing.sm },
  sectionBody: { fontSize: font.size.sm, color: palette.inkSoft, lineHeight: 20, marginBottom: spacing.sm },
  warningNote: { fontSize: font.size.xs, color: palette.inkSoft, backgroundColor: '#FFF8E6', padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, lineHeight: 18 },
  scheduledBox: { backgroundColor: '#FFF8E6', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.warning, gap: spacing.sm },
  scheduledTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink },
  scheduledBody: { fontSize: font.size.md, color: palette.inkSoft, lineHeight: 22 },
  scheduledDate: { fontWeight: font.weight.bold, color: palette.error },
});
