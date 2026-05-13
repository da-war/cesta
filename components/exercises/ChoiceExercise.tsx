import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import type { ExerciseProps } from './types';
import { haptic } from '@/lib/haptics';
import { speak } from '@/lib/speech';
import { palette, spacing, radius, font, motion } from '@/lib/theme';

interface Props extends ExerciseProps { audioOnly?: boolean; }

export function ChoiceExercise({ word, distractors, onResult, audioOnly = false }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const startedAt = useRef(Date.now());

  const choices = useMemo(() => {
    const pool = [word.en, ...distractors.slice(0, 3)];
    return shuffle(pool).slice(0, 4);
  }, [word.id]);

  React.useEffect(() => {
    if (audioOnly) setTimeout(() => speak(word.cs).catch(() => {}), 300);
  }, [word.id]);

  const handlePick = (choice: string) => {
    if (revealed) return;
    setPicked(choice); setRevealed(true);
    const correct = choice === word.en;
    if (correct) haptic.success(); else haptic.warning();
    setTimeout(() => onResult({ correct, timeTakenMs: Date.now() - startedAt.current }), correct ? 700 : 1400);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{audioOnly ? 'Tap what you hear' : 'Choose the translation'}</Text>
      <View style={styles.promptCard}>
        {audioOnly ? (
          <Pressable style={styles.audioBtnLarge} onPress={() => speak(word.cs)}>
            <Text style={styles.audioIconLarge}>🔊</Text>
          </Pressable>
        ) : (
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Pressable style={styles.audioBtnSmall} onPress={() => speak(word.cs)}>
              <Text style={{ fontSize: 18 }}>🔊</Text>
            </Pressable>
            <Text style={styles.czech}>{word.cs}</Text>
            {word.ipa ? <Text style={styles.ipa}>{word.ipa}</Text> : null}
          </View>
        )}
      </View>
      <View style={styles.choices}>
        {choices.map((c, i) => (
          <ChoiceButton key={`${c}-${i}`} label={c} picked={picked === c} isCorrect={c === word.en} revealed={revealed} onPress={() => handlePick(c)} />
        ))}
      </View>
    </View>
  );
}

function ChoiceButton({ label, picked, isCorrect, revealed, onPress }: {
  label: string; picked: boolean; isCorrect: boolean; revealed: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  React.useEffect(() => {
    if (revealed && picked) {
      if (isCorrect) scale.value = withSequence(withSpring(1.06, motion.bouncy), withSpring(1, motion.bouncy));
      else shake.value = withSequence(
        withTiming(-8, { duration: 50 }), withTiming(8, { duration: 80 }),
        withTiming(-6, { duration: 80 }), withTiming(0, { duration: 80 }));
    }
  }, [revealed, picked]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: shake.value }] }));

  let borderColor = palette.border, bg = palette.surfaceRaised, textColor = palette.ink;
  if (revealed) {
    if (isCorrect) { borderColor = palette.success; bg = '#EAFAF2'; textColor = palette.successDark; }
    else if (picked) { borderColor = palette.error; bg = '#FFEDED'; textColor = palette.error; }
  }
  return (
    <Animated.View style={[animStyle, { width: '48%' }]}>
      <Pressable onPress={onPress} disabled={revealed} style={[styles.choiceBtn, { backgroundColor: bg, borderColor }]}>
        <Text style={[styles.choiceText, { color: textColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  prompt: { fontSize: font.size.md, color: palette.inkMuted, fontWeight: font.weight.medium, textAlign: 'center' },
  promptCard: { backgroundColor: palette.surfaceRaised, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: palette.border, alignItems: 'center', minHeight: 160, justifyContent: 'center' },
  audioBtnLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  audioIconLarge: { fontSize: 40 },
  audioBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  czech: { fontSize: font.size.xxl, fontWeight: font.weight.extrabold, color: palette.ink },
  ipa: { fontSize: font.size.sm, color: palette.inkMuted, fontStyle: 'italic' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  choiceBtn: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 2, minHeight: 70, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: font.size.md, fontWeight: font.weight.semibold, textAlign: 'center' },
});
