import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { palette, font, spacing, radius } from '@/lib/theme';

export function StreakFlame({ streak, compact = false }: { streak: number; compact?: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (streak <= 0) return;
    scale.value = withRepeat(withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [streak]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const lit = streak > 0;
  return (
    <View style={[styles.row, compact && styles.compact]}>
      <Animated.View style={animStyle}>
        <Text style={[styles.flame, !lit && styles.dim]}>🔥</Text>
      </Animated.View>
      <Text style={[styles.num, !lit && { color: palette.inkMuted }]}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: '#FFF3EC', borderRadius: radius.pill },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  flame: { fontSize: 18 },
  dim: { opacity: 0.4 },
  num: { fontSize: font.size.md, fontWeight: font.weight.bold, color: palette.primary },
});
