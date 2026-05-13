import * as Haptics from 'expo-haptics';

let last = 0;
const GAP = 60;
function ok(): boolean { const n = Date.now(); if (n - last < GAP) return false; last = n; return true; }

export const haptic = {
  tick() { if (ok()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  medium() { if (ok()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); },
  success() { if (ok()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
  warning() { if (ok()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); },
  error() { if (ok()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); },
  heavy() { if (ok()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); },
};
