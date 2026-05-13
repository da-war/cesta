export type CefrLevel =
  | 'A1.0' | 'A1.1' | 'A1.2'
  | 'A2.0' | 'A2.1' | 'A2.2'
  | 'B1.0' | 'B1.1' | 'B1.2';

export type CefrBand = 'A1' | 'A2' | 'B1';
export type League = 'bronze' | 'silver' | 'gold' | 'emerald' | 'sapphire' | 'diamond';

export type ExerciseType =
  | 'flashcard' | 'tap_match' | 'listen' | 'type'
  | 'dictation' | 'sentence_build' | 'speak';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  cefr_level: CefrLevel;
  cefr_band: CefrBand;
  xp: number;
  streak_days: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal_xp: number;
  league: League;
  league_xp_week: number;
  hearts: number;
  hearts_refill_at: string | null;
  is_pro: boolean;
  entitlement_expires_at: string | null;
  timezone: string;
  has_completed_placement: boolean;
  has_completed_onboarding: boolean;
  notif_streak_enabled: boolean;
  notif_morning_enabled: boolean;
  notif_afternoon_enabled: boolean;
  notif_evening_enabled: boolean;
  push_token: string | null;
  age_confirmed: boolean;
  marketing_consent: boolean;
  analytics_consent: boolean;
  tracking_consent: boolean;
  consent_recorded_at: string | null;
  terms_accepted_version: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_version: string | null;
  privacy_accepted_at: string | null;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  region: CefrBand;
  region_name: string;
  display_order: number;
  title: string;
  description: string | null;
  is_boss: boolean;
  required_xp: number;
  cefr_sub_band: CefrLevel;
}

export interface Lesson {
  id: string;
  unit_id: string;
  display_order: number;
  title: string;
  target_xp: number;
  is_free: boolean;
}

export interface Word {
  id: string;
  cs: string;
  en: string;
  ipa: string | null;
  audio_path: string | null;
  pos: string | null;
  gender: 'm' | 'f' | 'n' | 'ma' | 'mi' | null;
  cefr: CefrLevel;
  frequency_rank: number | null;
  notes: string | null;
  example_cs: string | null;
  example_en: string | null;
}

export interface LessonItem {
  lesson_id: string;
  word_id: string;
  display_order: number;
  exercise_types: ExerciseType[];
}

export interface Distractor { word_id: string; wrong_en: string; }

export interface PlacementQuestion {
  id: string;
  cefr_target: CefrLevel;
  skill: 'vocab' | 'grammar' | 'listening';
  prompt_cs: string | null;
  prompt_en: string | null;
  audio_path: string | null;
  correct_answer: string;
  choices: string[];
}

export interface UserLessonProgress {
  user_id: string;
  lesson_id: string;
  stars: number;
  best_accuracy: number | null;
  completed_at: string | null;
  attempts: number;
}

export interface UserWordSRS {
  user_id: string;
  word_id: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      units: { Row: Unit; Insert: Unit; Update: Partial<Unit> };
      lessons: { Row: Lesson; Insert: Lesson; Update: Partial<Lesson> };
      words: { Row: Word; Insert: Word; Update: Partial<Word> };
      lesson_items: { Row: LessonItem; Insert: LessonItem; Update: Partial<LessonItem> };
      distractors: { Row: Distractor; Insert: Distractor; Update: Partial<Distractor> };
      placement_questions: { Row: PlacementQuestion; Insert: PlacementQuestion; Update: Partial<PlacementQuestion> };
      user_lesson_progress: { Row: UserLessonProgress; Insert: UserLessonProgress; Update: Partial<UserLessonProgress> };
      user_word_srs: { Row: UserWordSRS; Insert: UserWordSRS; Update: Partial<UserWordSRS> };
    };
    Views: {};
    Functions: {
      award_xp: { Args: { p_xp: number; p_lesson_id?: string; p_perfect?: boolean }; Returns: void };
      complete_lesson: { Args: { p_lesson_id: string; p_stars: number; p_accuracy: number }; Returns: void };
      lose_heart: { Args: Record<string, never>; Returns: number };
      maybe_refill_hearts: { Args: Record<string, never>; Returns: number };
      set_cefr_level: { Args: { p_level: CefrLevel }; Returns: void };
      request_account_deletion: { Args: Record<string, never>; Returns: void };
      cancel_account_deletion: { Args: Record<string, never>; Returns: void };
      delete_my_account_now: { Args: Record<string, never>; Returns: void };
      export_my_data: { Args: Record<string, never>; Returns: any };
      record_consent: { Args: { p_type: string; p_granted: boolean; p_version?: string }; Returns: void };
    };
    Enums: {};
  };
};
