import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { ExerciseProps } from './types';
import { Button } from '@/components/ui/Button';
import { matchTyped, CZECH_DIACRITICS } from '@/lib/text';
import { haptic } from '@/lib/haptics';
import { speak } from '@/lib/speech';
import { palette, spacing, radius, font } from '@/lib/theme';

interface Props extends ExerciseProps { direction?: 'en_to_cs' | 'cs_to_en'; }

export function TypeExercise({ word, onResult, direction = 'en_to_cs' }: Props) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState<null | 'correct' | 'close' | 'wrong'>(null);
  const startedAt = useRef(Date.now());
  const shake = useSharedValue(0);

  const prompt = direction === 'en_to_cs' ? word.en : word.cs;
  const target = direction === 'en_to_cs' ? word.cs : word.en;

  const handleCheck = () => {
    const result = matchTyped(value, target, 1);
    let status: 'correct' | 'close' | 'wrong';
    if (result.exact) status = 'correct';
    else if (result.closeEnough || result.diacriticOk) status = 'close';
    else status = 'wrong';
    setRevealed(status);
    if (status === 'correct') haptic.success();
    else if (status === 'close') haptic.medium();
    else { haptic.warning(); shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 80 }), withTiming(0, { duration: 80 })); }
    setTimeout(() => onResult({
      correct: status === 'correct' || status === 'close',
      closeEnough: status === 'close',
      timeTakenMs: Date.now() - startedAt.current,
    }), status === 'correct' ? 700 : 1600);
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const borderColor = revealed === 'correct' ? palette.success : revealed === 'close' ? palette.warning : revealed === 'wrong' ? palette.error : palette.border;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.prompt}>Type in {direction === 'en_to_cs' ? 'Czech' : 'English'}</Text>
        <View style={styles.promptCard}>
          {direction === 'en_to_cs' ? (
            <>
              <Pressable style={styles.audioBtn} onPress={() => speak(word.cs)}>
                <Text style={{ fontSize: 16 }}>🔊</Text>
              </Pressable>
              <Text style={styles.bigPrompt}>{prompt}</Text>
            </>
          ) : <Text style={styles.bigPrompt}>{prompt}</Text>}
        </View>
        <Animated.View style={animStyle}>
          <TextInput
            style={[styles.input, { borderColor }]}
            value={value} onChangeText={setValue}
            placeholder="Type here…" placeholderTextColor={palette.inkFaint}
            autoFocus autoCapitalize="none" autoCorrect={false}
            editable={revealed === null}
          />
        </Animated.View>
        {direction === 'en_to_cs' && (
          <View style={styles.diacritics}>
            {CZECH_DIACRITICS.map((c) => (
              <Pressable key={c} style={styles.diaChip} onPress={() => { setValue((v) => v + c); haptic.tick(); }} disabled={revealed !== null}>
                <Text style={styles.diaText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {revealed && revealed !== 'correct' ? (
          <View style={styles.reveal}>
            <Text style={styles.revealLabel}>{revealed === 'close' ? 'Close! Correct answer:' : 'Correct answer:'}</Text>
            <Text style={styles.revealAnswer}>{target}</Text>
          </View>
        ) : null}
        <Button label={revealed ? '…' : 'Check'} variant="primary" size="lg"
          disabled={value.trim().length === 0 || revealed !== null} onPress={handleCheck} hapticOnPress="none" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  prompt: { fontSize: font.size.md, color: palette.inkMuted, fontWeight: font.weight.medium, textAlign: 'center' },
  promptCard: { backgroundColor: palette.surfaceRaised, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: palette.border, alignItems: 'center', minHeight: 120, justifyContent: 'center', gap: spacing.sm },
  bigPrompt: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: palette.ink, textAlign: 'center' },
  audioBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, fontSize: font.size.xl, backgroundColor: palette.surfaceRaised, color: palette.ink, fontWeight: font.weight.semibold, textAlign: 'center' },
  diacritics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  diaChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: palette.surfaceSunken, borderRadius: radius.md, minWidth: 36, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  diaText: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: palette.ink },
  reveal: { alignItems: 'center', padding: spacing.md, backgroundColor: '#FFF8E6', borderRadius: radius.md, gap: 4 },
  revealLabel: { fontSize: font.size.sm, color: palette.inkMuted },
  revealAnswer: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: palette.ink },
});
