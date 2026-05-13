import React, { useState } from 'react';
import { Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font } from '@/lib/theme';
import { MIN_AGE } from '@/lib/company';
import { useAppStore } from '@/lib/store';
import { logoutRC } from '@/lib/revenuecat';
import { cancelAllReminders } from '@/lib/notifications';

export default function AgeGateScreen() {
  const setProfile = useAppStore((s) => s.setProfile);
  const profile = useAppStore((s) => s.profile);
  const [loading, setLoading] = useState(false);

  const reloadProfile = async () => {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (data) setProfile(data);
  };

  const handleConfirm = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('record_consent', { p_type: 'age', p_granted: true });
    if (error) { setLoading(false); Alert.alert('Error', error.message); return; }
    await reloadProfile();
    setLoading(false);
    router.replace('/(auth)/consent');
  };

  const handleDecline = () => {
    Alert.alert(
      'Sorry',
      `You must be at least ${MIN_AGE} years old to use Cesta. We'll close your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await supabase.rpc('record_consent', { p_type: 'age', p_granted: false });
            await supabase.rpc('delete_my_account_now').catch(() => {});
            await cancelAllReminders();
            await logoutRC();
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🎂</Text>
        <Text style={styles.title}>Quick check</Text>
        <Text style={styles.body}>
          Cesta is for people aged {MIN_AGE} and over. Please confirm you meet this requirement.
        </Text>
        <Text style={styles.bodyMuted}>
          We ask because some privacy laws (like GDPR-K and COPPA) protect younger users with different
          rules. If you're under {MIN_AGE}, we won't be able to give you an account.
        </Text>
        <Button label={`I am ${MIN_AGE} or older`} variant="primary" size="lg" onPress={handleConfirm} loading={loading} />
        <Button label={`I am under ${MIN_AGE}`} variant="ghost" size="md" onPress={handleDecline} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  emoji: { fontSize: 72, textAlign: 'center' },
  title: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink, textAlign: 'center' },
  body: { fontSize: font.size.md, color: palette.inkSoft, textAlign: 'center', lineHeight: 24 },
  bodyMuted: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm, marginBottom: spacing.xl },
});
