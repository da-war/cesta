import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { startTrialOrPurchase, restorePurchases } from '@/lib/revenuecat';
import { palette, spacing, font, radius } from '@/lib/theme';

const FEATURES = [
  { emoji: '❤️', title: 'Unlimited hearts', body: 'Never lose progress mid-lesson' },
  { emoji: '🎯', title: 'Spaced-repetition practice', body: 'Smart reviews when you need them' },
  { emoji: '🏆', title: 'Weekly leagues', body: 'Compete with learners at your level' },
  { emoji: '📴', title: 'Offline lessons', body: 'Download for plane rides and tunnels' },
  { emoji: '🚫', title: 'No ads ever', body: 'Pure focus on learning Czech' },
];

export default function PaywallScreen() {
  const [busy, setBusy] = useState(false);
  const handlePurchase = async () => {
    setBusy(true);
    const result = await startTrialOrPurchase();
    setBusy(false);
    if (result.cancelled) return;
    if (result.success) { Alert.alert('Welcome to Pro 🎉', "Your subscription is active."); router.back(); }
    else Alert.alert('Purchase failed', result.error ?? 'Please try again.');
  };
  const handleRestore = async () => {
    setBusy(true);
    const restored = await restorePurchases();
    setBusy(false);
    Alert.alert(restored ? 'Restored' : 'Nothing to restore', restored ? 'Your Pro subscription is active.' : 'No active subscription found.');
    if (restored) router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}><Text style={styles.closeText}>✕</Text></Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Cesta Pro</Text>
        <Text style={styles.subtitle}>Learn Czech faster. Cancel anytime.</Text>
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Button label="Start 3-day free trial" variant="primary" size="lg" onPress={handlePurchase} loading={busy} />
        <Pressable onPress={handleRestore}><Text style={styles.restore}>Restore purchases</Text></Pressable>
        <Text style={styles.fineprint}>
          Free trial automatically converts to annual subscription. Cancel anytime in the App Store /
          Play Store at least 24 hours before renewal. Subscription is managed by your store account;
          uninstalling Cesta does not cancel. Full details in our{' '}
          <Text style={styles.link} onPress={() => router.push('/legal/terms')}>Terms</Text>.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  closeBtn: { position: 'absolute', top: 60, right: 20, zIndex: 1, width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: palette.ink, fontWeight: '700' },
  content: { padding: spacing.xl, gap: spacing.md, paddingTop: spacing.xxxl },
  crown: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 40, fontWeight: font.weight.extrabold, color: palette.ink, textAlign: 'center' },
  subtitle: { fontSize: font.size.md, color: palette.inkMuted, textAlign: 'center', marginBottom: spacing.lg },
  features: { gap: spacing.md, marginVertical: spacing.lg },
  feature: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  featureEmoji: { fontSize: 28 },
  featureTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: palette.ink },
  featureBody: { fontSize: font.size.sm, color: palette.inkMuted, marginTop: 2 },
  restore: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center', textDecorationLine: 'underline', padding: spacing.md },
  fineprint: { fontSize: font.size.xs, color: palette.inkMuted, lineHeight: 18, marginTop: spacing.md },
  link: { color: palette.primary, textDecorationLine: 'underline' },
});
