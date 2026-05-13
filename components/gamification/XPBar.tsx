import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { palette, font, spacing } from '@/lib/theme';

interface Props { current: number; goal: number; label?: string; color?: string; height?: number; }

export function XPBar({ current, goal, label, color = palette.success, height = 12 }: Props) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const target = goal > 0 ? Math.min(current / goal, 1) : 0;
    progress.value = withTiming(target, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [current, goal]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{current} / {goal} XP</Text>
        </View>
      ) : null}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { fontSize: font.size.sm, color: palette.inkMuted, fontWeight: font.weight.medium },
  value: { fontSize: font.size.sm, color: palette.ink, fontWeight: font.weight.semibold },
  track: { backgroundColor: '#E8EAEC', overflow: 'hidden' },
  fill: { height: '100%' },
});
