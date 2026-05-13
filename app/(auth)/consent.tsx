import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';
import { LEGAL_VERSIONS } from '@/lib/company';
import { useAppStore } from '@/lib/store';
import { requestTrackingPermission } from '@/lib/tracking';
import { requestNotificationPermission } from '@/lib/notifications';

export default function ConsentScreen() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [loading, setLoading] = useState(false);

  const canProceed = terms && privacy;

  const handleContinue = async () => {
    if (!canProceed) {
      Alert.alert('Required', 'You must accept the Terms & Conditions and Privacy Policy to use Cesta.');
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        supabase.rpc('record_consent', { p_type: 'terms', p_granted: true, p_version: LEGAL_VERSIONS.terms }),
        supabase.rpc('record_consent', { p_type: 'privacy', p_granted: true, p_version: LEGAL_VERSIONS.privacy }),
        supabase.rpc('record_consent', { p_type: 'marketing', p_granted: marketing }),
        supabase.rpc('record_consent', { p_type: 'analytics', p_granted: analytics }),
      ]);
      // Reload profile so routing guard sees fresh terms/privacy versions
      if (profile) {
        const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
        if (data) setProfile(data);
      }
      // Now request ATT — only after user has read & consented to privacy policy
      await requestTrackingPermission().catch(() => {});
      // Request notification permission too (Apple/Google require context first — privacy is the context)
      await requestNotificationPermission().catch(() => {});
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
      return;
    }
    setLoading(false);
    router.replace('/(auth)/placement');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Before we start</Text>
        <Text style={styles.body}>
          We respect your privacy. Please review and confirm what you're okay with.
        </Text>

        <ConsentRow required value={terms} onChange={setTerms}
          title="Terms & Conditions" body="The rules for using Cesta. Tap to read."
          onPressLink={() => router.push('/legal/terms')} />
        <ConsentRow required value={privacy} onChange={setPrivacy}
          title="Privacy Policy" body="How we handle your data — never sold. Tap to read."
          onPressLink={() => router.push('/legal/privacy')} />
        <ConsentRow value={analytics} onChange={setAnalytics}
          title="Help us improve Cesta"
          body="Anonymous usage data to find bugs and improve lessons. Optional." />
        <ConsentRow value={marketing} onChange={setMarketing}
          title="Occasional emails"
          body="Tips, feature updates, and lessons. You can unsubscribe anytime. Optional." />

        <Button label="Continue" variant="primary" size="lg" onPress={handleContinue} disabled={!canProceed} loading={loading} />
        <Text style={styles.note}>You can change these choices anytime in Profile › Privacy.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConsentRow({ required, value, onChange, title, body, onPressLink }: {
  required?: boolean; value: boolean; onChange: (v: boolean) => void;
  title: string; body: string; onPressLink?: () => void;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.row}>
      <View style={[styles.box, value && styles.boxOn]}>
        {value && <Text style={styles.check}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {required && <Text style={styles.required}>required</Text>}
        </View>
        <Text style={styles.rowBody}>
          {body}{' '}
          {onPressLink && <Text style={styles.linkText} onPress={onPressLink}>Read</Text>}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  body: { fontSize: font.size.md, color: palette.inkMuted, lineHeight: 24, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  check: { color: '#fff', fontSize: 16, fontWeight: '900' },
  rowTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: palette.ink },
  rowBody: { fontSize: font.size.sm, color: palette.inkMuted, lineHeight: 20, marginTop: 2 },
  required: { fontSize: font.size.xs, color: palette.error, fontWeight: font.weight.bold, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#FFEDED', borderRadius: 4 },
  linkText: { color: palette.primary, fontWeight: font.weight.semibold, textDecorationLine: 'underline' },
  note: { fontSize: font.size.xs, color: palette.inkMuted, textAlign: 'center', marginTop: spacing.md },
});
