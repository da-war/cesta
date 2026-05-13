import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { CefrChip } from '@/components/gamification/CefrChip';
import { palette, spacing, font, radius } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { CefrLevel, PlacementQuestion } from '@/lib/database.types';

const BAND_ORDER: CefrLevel[] = ['A1.0','A1.1','A1.2','A2.0','A2.1','A2.2','B1.0','B1.1','B1.2'];
const START_BAND = 2;
const MAX_QUESTIONS = 24;

export default function PlacementScreen() {
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro');
  const [bandIdx, setBandIdx] = useState(START_BAND);
  const [history, setHistory] = useState<{ band: number; correct: boolean }[]>([]);
  const [currentQ, setCurrentQ] = useState<PlacementQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const consecutiveCorrect = useRef(0);
  const consecutiveWrong = useRef(0);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['placement-questions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('placement_questions').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (phase !== 'test' || !questions) return;
    const targetLevel = BAND_ORDER[bandIdx];
    const pool = questions.filter((q) => q.cefr_target === targetLevel);
    if (pool.length === 0) { finalize(); return; }
    const random = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQ(random); setPicked(null); setRevealed(false);
  }, [bandIdx, phase, questions]);

  const finalize = () => {
    const correctBands = history.filter((h) => h.correct).map((h) => h.band);
    const finalBand = correctBands.length > 0 ? Math.max(...correctBands) : Math.max(0, START_BAND - 1);
    setBandIdx(finalBand); setPhase('result');
  };

  const handlePick = (choice: string) => {
    if (!currentQ || revealed) return;
    setPicked(choice); setRevealed(true);
    const correct = choice === currentQ.correct_answer;
    if (correct) haptic.success(); else haptic.warning();
    if (correct) { consecutiveCorrect.current += 1; consecutiveWrong.current = 0; }
    else { consecutiveWrong.current += 1; consecutiveCorrect.current = 0; }
    setTimeout(() => {
      const newHistory = [...history, { band: bandIdx, correct }];
      setHistory(newHistory);
      if (newHistory.length >= MAX_QUESTIONS) { finalize(); return; }
      let nextBand = bandIdx;
      if (consecutiveCorrect.current >= 2 && bandIdx < BAND_ORDER.length - 1) {
        nextBand = bandIdx + 1; consecutiveCorrect.current = 0;
      } else if (consecutiveWrong.current >= 2 && bandIdx > 0) {
        nextBand = bandIdx - 1; consecutiveWrong.current = 0;
      }
      setBandIdx(nextBand);
    }, correct ? 800 : 1500);
  };

  const handleConfirm = async () => {
    await supabase.rpc('set_cefr_level', { p_level: BAND_ORDER[bandIdx] });
    // Reload profile so routing guard sees has_completed_placement = true
    const profileId = useAppStore.getState().profile?.id;
    if (profileId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      if (data) useAppStore.getState().setProfile(data);
    }
    router.replace('/(tabs)');
  };

  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Find your starting level</Text>
          <Text style={styles.body}>
            A short adaptive test — about 5–8 minutes. Questions get harder when you're doing well.
            At the end you'll see your exact CEFR level (A1.0 → B1.2).
          </Text>
          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <Button label="Start the test" variant="primary" size="lg" onPress={() => setPhase('test')} />
            <Button label="Skip — I'm a complete beginner" variant="ghost" size="md" onPress={async () => {
              await supabase.rpc('set_cefr_level', { p_level: 'A1.0' });
              const profileId = useAppStore.getState().profile?.id;
              if (profileId) {
                const { data } = await supabase.from('profiles').select('*').eq('id', profileId).single();
                if (data) useAppStore.getState().setProfile(data);
              }
              router.replace('/(tabs)');
            }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'result') {
    const finalLevel = BAND_ORDER[bandIdx];
    const isA2OrAbove = finalLevel.startsWith('A2') || finalLevel.startsWith('B1');
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.resultBox}>
          <Text style={styles.resultEmoji}>🎯</Text>
          <Text style={styles.resultTitle}>Your Czech is at</Text>
          <CefrChip level={finalLevel} size="lg" />
          <Text style={styles.resultBody}>
            {isA2OrAbove
              ? "Solid foundation. You'll skip ahead and build toward B1."
              : "Perfect starting point. We'll take you through fundamentals step by step."}
          </Text>
          <Button label="Start learning" variant="primary" size="lg" onPress={handleConfirm} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (isLoading || !currentQ) {
    return <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={palette.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.testHeader}>
        <Text style={styles.testProgress}>Question {history.length + 1} / {MAX_QUESTIONS}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(history.length / MAX_QUESTIONS) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.testBody}>
        <Text style={styles.qPrompt}>{currentQ.prompt_en ?? 'Choose the correct translation'}</Text>
        {currentQ.prompt_cs ? <Text style={styles.qCzech}>{currentQ.prompt_cs}</Text> : null}
        <View style={styles.choices}>
          {currentQ.choices.map((c) => {
            const isCorrect = c === currentQ.correct_answer;
            const isPicked = c === picked;
            let bg = palette.surfaceRaised, border = palette.border, text = palette.ink;
            if (revealed) {
              if (isCorrect) { bg = '#EAFAF2'; border = palette.success; text = palette.successDark; }
              else if (isPicked) { bg = '#FFEDED'; border = palette.error; text = palette.error; }
            }
            return (
              <Pressable key={c} onPress={() => handlePick(c)} disabled={revealed}
                style={[styles.choiceBtn, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[styles.choiceText, { color: text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.xl, gap: spacing.md, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  body: { fontSize: font.size.md, color: palette.inkSoft, lineHeight: 24 },
  testHeader: { padding: spacing.lg, gap: spacing.sm },
  testProgress: { fontSize: font.size.sm, color: palette.inkMuted, fontWeight: font.weight.semibold },
  progressTrack: { height: 6, backgroundColor: palette.borderSoft, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.primary, borderRadius: 3 },
  testBody: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  qPrompt: { fontSize: font.size.md, color: palette.inkMuted, textAlign: 'center', fontWeight: font.weight.medium },
  qCzech: { fontSize: font.size.xxl, fontWeight: font.weight.extrabold, color: palette.ink, textAlign: 'center' },
  choices: { gap: spacing.md, marginTop: spacing.lg },
  choiceBtn: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 2, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  resultEmoji: { fontSize: 72 },
  resultTitle: { fontSize: font.size.xl, color: palette.inkMuted, fontWeight: font.weight.medium },
  resultBody: { fontSize: font.size.md, color: palette.inkSoft, textAlign: 'center', lineHeight: 24, marginVertical: spacing.md },
});
