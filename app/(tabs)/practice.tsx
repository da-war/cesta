import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile, useIsPro } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';

export default function PracticeScreen() {
  const profile = useProfile();
  const isPro = useIsPro();

  const { data: due = 0, isLoading } = useQuery({
    queryKey: ['srs-due', profile?.id],
    queryFn: async () => {
      if (!profile) return 0;
      const { count } = await supabase
        .from('user_word_srs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('due_at', new Date().toISOString());
      return count ?? 0;
    },
    enabled: !!profile,
  });

  if (!isPro) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.lockedWrap}>
          <Text style={styles.lockEmoji}>🎯</Text>
          <Text style={styles.lockTitle}>Practice mode</Text>
          <Text style={styles.lockBody}>
            Smart spaced-repetition: review what you've learned right when you're about to forget.
            Builds long-term memory.
          </Text>
          <View style={styles.lockBadge}>
            <Text style={styles.lockBadgeText}>✨ Pro feature</Text>
          </View>
          <Button label="Try Cesta Pro free" variant="primary" size="lg" onPress={() => router.push('/paywall')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Practice</Text>
        <Text style={styles.body}>Reviews scheduled by science, not by guess.</Text>

        <View style={styles.statsCard}>
          {isLoading ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <>
              <Text style={styles.statsNum}>{due}</Text>
              <Text style={styles.statsLabel}>{due === 1 ? 'word' : 'words'} due now</Text>
            </>
          )}
        </View>

        <Button
          label={due > 0 ? `Start ${Math.min(due, 20)}-word review` : 'No reviews — come back later'}
          variant="primary" size="lg" disabled={due === 0}
          onPress={() => router.push('/lesson/__practice__')}
        />
        <Text style={styles.note}>Tip: Daily reviews of 10–15 words is the sweet spot.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  h1: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  body: { fontSize: font.size.md, color: palette.inkMuted },
  statsCard: { padding: spacing.xxl, backgroundColor: palette.surfaceRaised, borderRadius: radius.xl, borderWidth: 1, borderColor: palette.border, alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  statsNum: { fontSize: 64, fontWeight: font.weight.extrabold, color: palette.primary, lineHeight: 70 },
  statsLabel: { fontSize: font.size.md, color: palette.inkMuted, fontWeight: font.weight.medium },
  note: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center', marginTop: spacing.lg },
  lockedWrap: { flexGrow: 1, padding: spacing.xl, gap: spacing.md, alignItems: 'center', justifyContent: 'center' },
  lockEmoji: { fontSize: 72 },
  lockTitle: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink, textAlign: 'center' },
  lockBody: { fontSize: font.size.md, color: palette.inkSoft, textAlign: 'center', lineHeight: 24 },
  lockBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: '#FFF3EC', borderRadius: radius.pill, marginVertical: spacing.md },
  lockBadgeText: { color: palette.primary, fontWeight: font.weight.bold },
});
