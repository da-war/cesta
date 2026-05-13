import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useProfile, useAppStore } from '@/lib/store';
import { FlashcardExercise } from '@/components/exercises/FlashcardExercise';
import { ChoiceExercise } from '@/components/exercises/ChoiceExercise';
import { TypeExercise } from '@/components/exercises/TypeExercise';
import { Button } from '@/components/ui/Button';
import { Hearts } from '@/components/gamification/Hearts';
import { palette, spacing, font, radius } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { freshSrs, review, type SRSState } from '@/lib/srs';
import type { Word, ExerciseType, LessonItem, Distractor, UserWordSRS } from '@/lib/database.types';

interface QueueItem { word: Word; type: ExerciseType; distractors: string[]; }

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const setProfile = useAppStore((s) => s.setProfile);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const isPractice = id === '__practice__';

  const { data, isLoading } = useQuery({
    queryKey: ['lesson-data', id, profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      if (isPractice) {
        const { data: srs } = await supabase.from('user_word_srs').select('*')
          .eq('user_id', profile.id).lte('due_at', new Date().toISOString())
          .order('due_at').limit(20);
        const wordIds = (srs ?? []).map((s) => s.word_id);
        if (wordIds.length === 0) return { words: [], items: [], distractors: [] };
        const { data: words } = await supabase.from('words').select('*').in('id', wordIds);
        const { data: distractors } = await supabase.from('distractors').select('*').in('word_id', wordIds);
        return { words: words ?? [], items: [], distractors: distractors ?? [] };
      }
      const { data: items } = await supabase.from('lesson_items').select('*').eq('lesson_id', id).order('display_order');
      const wordIds = (items ?? []).map((i) => i.word_id);
      if (wordIds.length === 0) return { words: [], items: [], distractors: [] };
      const { data: words } = await supabase.from('words').select('*').in('id', wordIds);
      const { data: distractors } = await supabase.from('distractors').select('*').in('word_id', wordIds);
      return { words: words ?? [], items: items ?? [], distractors: distractors ?? [] };
    },
    enabled: !!profile && !!id,
  });

  useEffect(() => {
    if (!data) return;
    const built: QueueItem[] = [];
    if (isPractice) {
      // SRS: 1 type exercise per due word
      data.words.forEach((w) => {
        const wDistractors = data.distractors.filter((d) => d.word_id === w.id).map((d) => d.wrong_en);
        const types: ExerciseType[] = ['type', 'tap_match', 'listen'];
        const type = types[Math.floor(Math.random() * types.length)];
        built.push({ word: w, type, distractors: wDistractors });
      });
    } else {
      // Lesson: 8 words per session, each seen as flashcard intro + 1 practice exercise = ~16 items
      const sessionItems = data.items.slice(0, 8);
      sessionItems.forEach((item: LessonItem) => {
        const word = data.words.find((w) => w.id === item.word_id);
        if (!word) return;
        const wDistractors = data.distractors.filter((d) => d.word_id === word.id).map((d) => d.wrong_en);
        const practiceTypes = item.exercise_types.filter((t) => t !== 'flashcard');
        const practiceType = practiceTypes[Math.floor(Math.random() * practiceTypes.length)] ?? 'tap_match';
        built.push({ word, type: 'flashcard', distractors: wDistractors });
        built.push({ word, type: practiceType, distractors: wDistractors });
      });
    }
    setQueue(built);
  }, [data, isPractice]);

  const handleResult = async (result: { correct: boolean; closeEnough?: boolean }) => {
    const item = queue[idx];
    if (result.correct) { setCorrect((c) => c + 1); }
    else {
      setWrong((w) => w + 1);
      // lose heart
      try {
        const { data: heartsLeft } = await supabase.rpc('lose_heart');
        if (profile && typeof heartsLeft === 'number') {
          setProfile({ ...profile, hearts: heartsLeft });
          if (heartsLeft === 0) {
            haptic.error();
            Alert.alert('Out of hearts', 'Take a break, or get Pro for unlimited hearts.', [
              { text: 'Later', style: 'cancel', onPress: () => router.back() },
              { text: 'Get Pro', onPress: () => { router.back(); router.push('/paywall'); } },
            ]);
            return;
          }
        }
      } catch {}
    }
    // update SRS
    if (profile) {
      const grade = result.correct ? (result.closeEnough ? 1 : 3) : 0;
      try {
        const { data: existing } = await supabase.from('user_word_srs').select('*')
          .eq('user_id', profile.id).eq('word_id', item.word.id).maybeSingle();
        const state: SRSState = existing ? {
          ease: existing.ease, intervalDays: existing.interval_days,
          reps: existing.reps, lapses: existing.lapses, dueAt: new Date(existing.due_at),
        } : freshSrs();
        const updated = review(state, grade as 0 | 1 | 3);
        await supabase.from('user_word_srs').upsert({
          user_id: profile.id, word_id: item.word.id,
          ease: updated.ease, interval_days: updated.intervalDays,
          reps: updated.reps, lapses: updated.lapses,
          due_at: updated.dueAt.toISOString(), last_reviewed_at: new Date().toISOString(),
        });
      } catch (e) { console.warn(e); }
    }
    if (idx + 1 >= queue.length) {
      finishLesson();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const finishLesson = async () => {
    const accuracy = queue.length > 0 ? correct / queue.length : 0;
    const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : 1;
    const xpEarned = Math.max(5, Math.round(accuracy * 20));
    if (profile && !isPractice && id) {
      await supabase.rpc('complete_lesson', { p_lesson_id: id, p_stars: stars, p_accuracy: accuracy });
      await supabase.rpc('award_xp', { p_xp: xpEarned, p_lesson_id: id, p_perfect: accuracy === 1 });
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data);
    } else if (profile && isPractice) {
      await supabase.rpc('award_xp', { p_xp: xpEarned });
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data);
    }
    haptic.success();
    setDone(true);
  };

  if (isLoading || !profile) {
    return <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={palette.primary} /></SafeAreaView>;
  }

  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>Lesson not ready</Text>
          <Text style={styles.emptyBody}>This lesson has no content yet. Run the content seed script (see README).</Text>
          <Button label="Back to path" variant="primary" size="md" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const accuracy = queue.length > 0 ? Math.round((correct / queue.length) * 100) : 0;
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.completeBox}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Lesson complete!</Text>
          <View style={styles.completeStats}>
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Correct" value={correct} />
            <Stat label="Missed" value={wrong} />
          </View>
          <Button label="Continue" variant="primary" size="lg" onPress={() => router.back()} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const current = queue[idx];
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => Alert.alert('Quit lesson?', 'Progress in this lesson will be lost.', [
          { text: 'Stay', style: 'cancel' }, { text: 'Quit', style: 'destructive', onPress: () => router.back() },
        ])}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((idx + 1) / queue.length) * 100}%` }]} />
        </View>
        <Hearts count={profile.hearts} compact />
      </View>
      <View style={{ flex: 1 }}>
        {current.type === 'flashcard' ? (
          <FlashcardExercise word={current.word} distractors={current.distractors} onResult={handleResult} />
        ) : current.type === 'listen' ? (
          <ChoiceExercise word={current.word} distractors={current.distractors} onResult={handleResult} audioOnly />
        ) : current.type === 'type' ? (
          <TypeExercise word={current.word} distractors={current.distractors} onResult={handleResult} />
        ) : (
          <ChoiceExercise word={current.word} distractors={current.distractors} onResult={handleResult} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  close: { fontSize: 24, color: palette.inkMuted, fontWeight: '700', width: 30 },
  progressTrack: { flex: 1, height: 8, backgroundColor: palette.borderSoft, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.success, borderRadius: 4 },
  completeBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  completeEmoji: { fontSize: 80 },
  completeTitle: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  completeStats: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.lg, width: '100%' },
  statValue: { fontSize: font.size.xxl, fontWeight: font.weight.extrabold, color: palette.primary },
  statLabel: { fontSize: font.size.xs, color: palette.inkMuted, fontWeight: font.weight.semibold, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: palette.ink },
  emptyBody: { fontSize: font.size.sm, color: palette.inkMuted, textAlign: 'center', lineHeight: 22 },
});
