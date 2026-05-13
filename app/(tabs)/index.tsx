import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile, useIsPro, useAppStore } from '@/lib/store';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { Hearts } from '@/components/gamification/Hearts';
import { XPBar } from '@/components/gamification/XPBar';
import { CefrChip } from '@/components/gamification/CefrChip';
import { palette, spacing, font, radius, regionColor } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { Lesson, Unit, UserLessonProgress } from '@/lib/database.types';

export default function PathScreen() {
  const profile = useProfile();
  const isPro = useIsPro();
  const setProfile = useAppStore((s) => s.setProfile);
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []) as Unit[];
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lessons').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', profile.id);
      if (error) throw error;
      return (data ?? []) as UserLessonProgress[];
    },
    enabled: !!profile,
  });

  const { data: todayXP = 0 } = useQuery({
    queryKey: ['today-xp', profile?.id],
    queryFn: async () => {
      if (!profile) return 0;
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from('user_daily_activity')
        .select('xp_earned').eq('user_id', profile.id).eq('activity_date', today).maybeSingle();
      return data?.xp_earned ?? 0;
    },
    enabled: !!profile,
    refetchInterval: 30_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (profile) {
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data);
    }
    setRefreshing(false);
  };

  if (!profile) {
    return <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={palette.primary} /></SafeAreaView>;
  }

  const goal = profile.daily_goal_xp;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CefrChip level={profile.cefr_level} />
        </View>
        <View style={styles.headerRight}>
          <StreakFlame streak={profile.streak_days} compact />
          <Hearts count={profile.hearts} compact />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Today's goal</Text>
          <XPBar current={todayXP} goal={goal} color={palette.success} height={14} />
          <Text style={styles.goalHint}>
            {todayXP >= goal ? '🎉 Goal met! Streak is safe.' : `Earn ${goal - todayXP} more XP to keep your streak`}
          </Text>
        </View>

        {!isPro && (
          <Pressable style={styles.proCard} onPress={() => router.push('/paywall')}>
            <Text style={styles.proTitle}>✨ Try Cesta Pro free</Text>
            <Text style={styles.proBody}>Unlimited hearts, SRS practice, leagues, offline mode</Text>
          </Pressable>
        )}

        {units.map((unit) => {
          const unitLessons = lessons.filter((l) => l.unit_id === unit.id);
          const completed = unitLessons.filter((l) => progress.some((p) => p.lesson_id === l.id && p.completed_at)).length;
          return (
            <View key={unit.id} style={styles.unitSection}>
              <View style={styles.unitHeader}>
                <View style={[styles.unitBadge, { backgroundColor: regionColor(unit.region) }]}>
                  <Text style={styles.unitBadgeText}>{unit.cefr_sub_band}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unitTitle}>{unit.title}</Text>
                  <Text style={styles.unitMeta}>{completed} / {unitLessons.length} lessons</Text>
                </View>
              </View>
              <View style={styles.lessonGrid}>
                {unitLessons.map((lesson, idx) => {
                  const lp = progress.find((p) => p.lesson_id === lesson.id);
                  const isComplete = !!lp?.completed_at;
                  const stars = lp?.stars ?? 0;
                  const locked = !isPro && !lesson.is_free && idx > 0;
                  return (
                    <Pressable
                      key={lesson.id}
                      onPress={() => {
                        if (locked) { haptic.warning(); router.push('/paywall'); return; }
                        haptic.tick(); router.push(`/lesson/${lesson.id}`);
                      }}
                      style={[styles.lessonNode, isComplete && styles.lessonNodeDone, locked && styles.lessonNodeLocked]}
                    >
                      <Text style={styles.lessonEmoji}>{locked ? '🔒' : isComplete ? '⭐' : '📖'}</Text>
                      <Text style={[styles.lessonTitle, locked && { color: palette.inkMuted }]} numberOfLines={2}>{lesson.title}</Text>
                      {isComplete && <Text style={styles.starsText}>{'⭐'.repeat(stars)}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {units.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Content loading…</Text>
            <Text style={styles.emptyBody}>If this persists, run the content seed script (see README).</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerLeft: {},
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  goalCard: { backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.sm },
  goalLabel: { fontSize: font.size.sm, color: palette.inkMuted, fontWeight: font.weight.semibold },
  goalHint: { fontSize: font.size.sm, color: palette.inkSoft },
  proCard: { backgroundColor: palette.primary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  proTitle: { fontSize: font.size.lg, color: '#fff', fontWeight: font.weight.extrabold },
  proBody: { fontSize: font.size.sm, color: '#fff', opacity: 0.95 },
  unitSection: { gap: spacing.md },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unitBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  unitBadgeText: { color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.xs },
  unitTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink },
  unitMeta: { fontSize: font.size.sm, color: palette.inkMuted },
  lessonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  lessonNode: { width: '31%', aspectRatio: 1, backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: 4 },
  lessonNodeDone: { backgroundColor: '#EAFAF2', borderColor: palette.success },
  lessonNodeLocked: { backgroundColor: palette.surfaceSunken },
  lessonEmoji: { fontSize: 26 },
  lessonTitle: { fontSize: font.size.xs, fontWeight: font.weight.semibold, color: palette.ink, textAlign: 'center' },
  starsText: { fontSize: 10 },
  emptyState: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink },
  emptyBody: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center' },
});
