import React from 'react';
import { Pressable, Text, View, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { palette, radius, font, spacing, motion, useTheme } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  hapticOnPress?: 'tick' | 'success' | 'warning' | 'none';
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, hapticOnPress = 'tick',
  style, textStyle, leftIcon, fullWidth = true,
}: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { bg, fg, border } = colorsFor(variant, theme.isDark);
  const padding =
    size === 'sm' ? { paddingVertical: 10, paddingHorizontal: spacing.lg }
    : size === 'lg' ? { paddingVertical: 18, paddingHorizontal: spacing.xl }
    : { paddingVertical: 14, paddingHorizontal: spacing.xl };

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, motion.bouncy); }}
        onPressOut={() => { scale.value = withSpring(1, motion.bouncy); }}
        onPress={() => { if (hapticOnPress !== 'none') haptic[hapticOnPress](); onPress?.(); }}
        disabled={disabled || loading}
        style={[styles.btn, padding, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 }, style]}
      >
        {leftIcon ? <View style={styles.iconWrap}>{leftIcon}</View> : null}
        <Text style={[styles.label, { color: fg, fontSize: size === 'lg' ? font.size.lg : font.size.md }, textStyle]}>
          {loading ? '…' : label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function colorsFor(v: Variant, isDark: boolean) {
  switch (v) {
    case 'primary': return { bg: palette.primary, fg: '#fff', border: palette.primaryDark };
    case 'success': return { bg: palette.success, fg: '#fff', border: palette.successDark };
    case 'danger': return { bg: palette.error, fg: '#fff', border: palette.error };
    case 'secondary': return {
      bg: isDark ? palette.darkSurfaceRaised : palette.surfaceRaised,
      fg: isDark ? palette.darkInk : palette.ink,
      border: isDark ? palette.darkBorder : palette.border,
    };
    case 'ghost': return { bg: 'transparent', fg: isDark ? palette.darkInk : palette.ink, border: 'transparent' };
  }
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.lg, borderBottomWidth: 3, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  label: { fontWeight: font.weight.bold, letterSpacing: 0.2 },
  iconWrap: { marginRight: spacing.sm },
});
