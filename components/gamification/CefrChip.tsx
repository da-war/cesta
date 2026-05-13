import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CefrLevel } from '@/lib/database.types';
import { font, radius, regionColor } from '@/lib/theme';

export function CefrChip({ level, size = 'md' }: { level: CefrLevel; size?: 'sm' | 'md' | 'lg' }) {
  const band = level.substring(0, 2) as 'A1' | 'A2' | 'B1';
  const color = regionColor(band);
  const padding =
    size === 'sm' ? { paddingHorizontal: 8, paddingVertical: 2 }
    : size === 'lg' ? { paddingHorizontal: 16, paddingVertical: 8 }
    : { paddingHorizontal: 12, paddingVertical: 4 };
  const fontSize = size === 'sm' ? font.size.xs : size === 'lg' ? font.size.lg : font.size.sm;
  return (
    <View style={[styles.chip, padding, { backgroundColor: `${color}1A`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontWeight: font.weight.bold, letterSpacing: 0.4 },
});
