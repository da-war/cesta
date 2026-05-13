import type { Word, ExerciseType } from '@/lib/database.types';

export interface ExerciseResult {
  correct: boolean;
  closeEnough?: boolean;
  timeTakenMs: number;
}

export interface ExerciseProps {
  word: Word;
  distractors: string[];
  onResult: (r: ExerciseResult) => void;
  autoAdvanceMs?: number;
}

export type AnyExerciseType = ExerciseType;
