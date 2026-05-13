import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { palette, font, spacing, radius, motion } from '@/lib/theme';

export function Hearts({ count, total = 5, compact = false }: { count: number; total?: number; compact?: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(withSpring(1.2, motion.bouncy), withSpring(1, motion.bouncy));
  }, [count]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.wrap, compact && styles.compact, animStyle]}>
      <Text style={styles.heart}>❤️</Text>
      <Text style={[styles.num, count === 0 && { color: palette.error }]}>
        {count}{!compact && <Text style={styles.total}>/{total}</Text>}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: '#FFEDED', borderRadius: radius.pill },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  heart: { fontSize: 16 },
  num: { fontSize: font.size.md, fontWeight: font.weight.bold, color: palette.error },
  total: { color: palette.inkMuted, fontWeight: font.weight.regular },
});
