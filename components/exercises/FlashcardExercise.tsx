import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { ExerciseProps } from './types';
import { Button } from '@/components/ui/Button';
import { speak } from '@/lib/speech';
import { palette, spacing, radius, font, motion } from '@/lib/theme';

export function FlashcardExercise({ word, onResult }: ExerciseProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const startedAt = React.useRef(Date.now());

  useEffect(() => {
    opacity.value = withSpring(1, motion.spring);
    translateY.value = withSpring(0, motion.spring);
    setTimeout(() => speak(word.cs).catch(() => {}), 350);
  }, [word.id]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>New word</Text>
      <Animated.View style={[styles.card, cardStyle]}>
        <Pressable style={styles.audioBtn} onPress={() => speak(word.cs)}>
          <Text style={styles.audioIcon}>🔊</Text>
        </Pressable>
        <Text style={styles.czech}>{word.cs}</Text>
        {word.ipa ? <Text style={styles.ipa}>{word.ipa}</Text> : null}
        <View style={styles.divider} />
        <Text style={styles.english}>{word.en}</Text>
        {word.example_cs ? (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleCs}>{word.example_cs}</Text>
            <Text style={styles.exampleEn}>{word.example_en}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Button
        label="Got it"
        variant="primary"
        size="lg"
        onPress={() => onResult({ correct: true, timeTakenMs: Date.now() - startedAt.current })}
        hapticOnPress="tick"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  prompt: { fontSize: font.size.md, color: palette.inkMuted, fontWeight: font.weight.medium, textAlign: 'center' },
  card: { backgroundColor: palette.surfaceRaised, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: palette.border, alignItems: 'center', gap: spacing.md },
  audioBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  audioIcon: { fontSize: 24 },
  czech: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  ipa: { fontSize: font.size.md, color: palette.inkMuted, fontStyle: 'italic' },
  divider: { height: 1, width: '100%', backgroundColor: palette.borderSoft, marginVertical: spacing.sm },
  english: { fontSize: font.size.xl, color: palette.inkSoft, fontWeight: font.weight.medium },
  exampleBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: palette.surfaceSunken, borderRadius: radius.md, width: '100%', gap: 4 },
  exampleCs: { fontSize: font.size.md, color: palette.ink, fontWeight: font.weight.medium },
  exampleEn: { fontSize: font.size.sm, color: palette.inkMuted },
});
