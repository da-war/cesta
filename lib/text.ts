export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m = a.length, n = b.length;
  const dp = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

export interface MatchResult {
  exact: boolean;
  diacriticOk: boolean;
  closeEnough: boolean;
  distance: number;
}

export function matchTyped(typed: string, target: string, tolerance = 1): MatchResult {
  const t = normalize(typed); const g = normalize(target);
  if (t === g) return { exact: true, diacriticOk: true, closeEnough: true, distance: 0 };
  const ts = stripDiacritics(t); const gs = stripDiacritics(g);
  const diacriticOk = ts === gs;
  const distance = levenshtein(ts, gs);
  return { exact: false, diacriticOk, closeEnough: distance <= tolerance, distance };
}

export const CZECH_DIACRITICS = ['á','č','ď','é','ě','í','ň','ó','ř','š','ť','ú','ů','ý','ž'] as const;
