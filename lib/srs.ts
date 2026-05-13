export type Grade = 0 | 1 | 2 | 3;

export interface SRSState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: Date;
}

export const DEFAULT_SRS: Omit<SRSState, 'dueAt'> = {
  ease: 2.5, intervalDays: 0, reps: 0, lapses: 0,
};

export function freshSrs(now = new Date()): SRSState {
  return { ...DEFAULT_SRS, dueAt: now };
}

export function review(state: SRSState, grade: Grade, now = new Date()): SRSState {
  let { ease, intervalDays, reps, lapses } = state;
  if (grade === 0) {
    lapses += 1; reps = 0; intervalDays = 0;
    ease = clampEase(ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease * 10) / 10;
    if (grade === 1) ease = clampEase(ease - 0.15);
    else if (grade === 3) ease = clampEase(ease + 0.1);
  }
  const due = new Date(now.getTime());
  if (intervalDays === 0) due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + Math.ceil(intervalDays));
  return { ease, intervalDays, reps, lapses, dueAt: due };
}

function clampEase(v: number): number {
  return Math.max(1.3, Math.min(2.8, Math.round(v * 100) / 100));
}

export function freshness(state: SRSState, now = new Date()): 'new' | 'learning' | 'review' | 'mastered' | 'fading' {
  if (state.reps === 0) return 'new';
  if (state.reps < 3) return 'learning';
  const dueIn = (state.dueAt.getTime() - now.getTime()) / 86400000;
  if (dueIn < -1) return 'fading';
  if (state.intervalDays >= 21) return 'mastered';
  return 'review';
}
