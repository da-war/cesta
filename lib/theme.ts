import { useColorScheme } from 'react-native';

export const palette = {
  primary: '#FF4D2E',
  primaryDark: '#D63A1F',
  primaryLight: '#FF6B4F',
  success: '#2BB673',
  successDark: '#1F8E58',
  error: '#FF6B6B',
  warning: '#FFB020',
  info: '#3D8BFD',
  ink: '#0F1419',
  inkSoft: '#2B3340',
  inkMuted: '#6B7480',
  inkFaint: '#A8AFB8',
  border: '#E5E7EB',
  borderSoft: '#F0F1F3',
  surface: '#FAFAF7',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F2F2EE',
  darkInk: '#F5F5F0',
  darkInkSoft: '#C5C7CC',
  darkInkMuted: '#7B8089',
  darkBorder: '#1F242C',
  darkSurface: '#0F1419',
  darkSurfaceRaised: '#171C24',
  darkSurfaceSunken: '#0A0E14',
  a1: '#FF4D2E',
  a2: '#FFB020',
  b1: '#3D8BFD',
  bronze: '#CD7F32',
  silver: '#B9C0C7',
  gold: '#FFB800',
  emerald: '#2BB673',
  sapphire: '#3D8BFD',
  diamond: '#9F7FFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, xxxl: 36, display: 48 },
  weight: {
    regular: '400' as const, medium: '500' as const, semibold: '600' as const,
    bold: '700' as const, extrabold: '800' as const,
  },
} as const;
export const motion = {
  spring: { damping: 18, stiffness: 180, mass: 1 },
  bouncy: { damping: 12, stiffness: 220, mass: 1 },
  gentle: { damping: 24, stiffness: 140, mass: 1 },
  timing: { fast: 180, base: 280, slow: 480 },
} as const;

export interface Theme {
  ink: string; inkSoft: string; inkMuted: string;
  border: string; borderSoft: string;
  surface: string; surfaceRaised: string; surfaceSunken: string;
  primary: string; isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    ink: isDark ? palette.darkInk : palette.ink,
    inkSoft: isDark ? palette.darkInkSoft : palette.inkSoft,
    inkMuted: isDark ? palette.darkInkMuted : palette.inkMuted,
    border: isDark ? palette.darkBorder : palette.border,
    borderSoft: isDark ? palette.darkBorder : palette.borderSoft,
    surface: isDark ? palette.darkSurface : palette.surface,
    surfaceRaised: isDark ? palette.darkSurfaceRaised : palette.surfaceRaised,
    surfaceSunken: isDark ? palette.darkSurfaceSunken : palette.surfaceSunken,
    primary: palette.primary,
    isDark,
  };
}

export const regionColor = (band: 'A1' | 'A2' | 'B1') =>
  band === 'A1' ? palette.a1 : band === 'A2' ? palette.a2 : palette.b1;

export const leagueColor = (league: string) =>
  (palette as any)[league] ?? palette.bronze;
