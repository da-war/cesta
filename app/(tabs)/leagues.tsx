import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useIsPro, useProfile } from '@/lib/store';
import { palette, spacing, font, radius, leagueColor } from '@/lib/theme';

export default function LeaguesScreen() {
  const isPro = useIsPro();
  const profile = useProfile();

  if (!isPro) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.lockedWrap}>
          <Text style={styles.lockEmoji}>🏆</Text>
          <Text style={styles.lockTitle}>Compete in Leagues</Text>
          <Text style={styles.lockBody}>
            Weekly leaderboards with 30 learners at your level. Top 10 promote, bottom 5 demote.
            Bronze → Diamond.
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
        <Text style={styles.h1}>Leagues</Text>
        <View style={[styles.leagueCard, { backgroundColor: `${leagueColor(profile?.league ?? 'bronze')}15`, borderColor: leagueColor(profile?.league ?? 'bronze') }]}>
          <Text style={styles.leagueEmoji}>🏅</Text>
          <Text style={styles.leagueName}>{(profile?.league ?? 'bronze').toUpperCase()} LEAGUE</Text>
          <Text style={styles.leagueXP}>{profile?.league_xp_week ?? 0} XP this week</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Leaderboard coming soon</Text>
          <Text style={styles.emptyBody}>Cohort assignment runs weekly on Mondays.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  h1: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  leagueCard: { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 2, alignItems: 'center', gap: spacing.xs },
  leagueEmoji: { fontSize: 64 },
  leagueName: { fontSize: font.size.lg, fontWeight: font.weight.extrabold, color: palette.ink, letterSpacing: 1.5 },
  leagueXP: { fontSize: font.size.md, color: palette.inkMuted },
  emptyState: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink },
  emptyBody: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center' },
  lockedWrap: { flexGrow: 1, padding: spacing.xl, gap: spacing.md, alignItems: 'center', justifyContent: 'center' },
  lockEmoji: { fontSize: 72 },
  lockTitle: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink, textAlign: 'center' },
  lockBody: { fontSize: font.size.md, color: palette.inkSoft, textAlign: 'center', lineHeight: 24 },
  lockBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: '#FFF3EC', borderRadius: radius.pill, marginVertical: spacing.md },
  lockBadgeText: { color: palette.primary, fontWeight: font.weight.bold },
});
