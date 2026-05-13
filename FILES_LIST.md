# Cesta — Complete Files List

**56 files total.** Copy each to your project at the matching path.

## Root config (6)
- `package.json`
- `app.json`
- `babel.config.js`
- `tsconfig.json`
- `.env.example` → copy to `.env` and fill in
- `.gitignore`

## Database (1)
- `supabase/migrations/20260512000000_initial_schema.sql`

## Library (12 in `lib/`)
- `lib/supabase.ts`
- `lib/database.types.ts`
- `lib/theme.ts`
- `lib/srs.ts`
- `lib/speech.ts` ← **system TTS**
- `lib/notifications.ts` ← **3x daily reminders + smart cancel**
- `lib/haptics.ts`
- `lib/revenuecat.ts`
- `lib/store.ts`
- `lib/text.ts`
- `lib/tracking.ts`
- `lib/company.ts`

## Components (9)
- `components/ui/Button.tsx`
- `components/gamification/StreakFlame.tsx`
- `components/gamification/XPBar.tsx`
- `components/gamification/Hearts.tsx`
- `components/gamification/CefrChip.tsx`
- `components/exercises/types.ts`
- `components/exercises/FlashcardExercise.tsx`
- `components/exercises/ChoiceExercise.tsx`
- `components/exercises/TypeExercise.tsx`

## App screens (18)
- `app/_layout.tsx` (root + routing guard + voice availability check)
- `app/(auth)/_layout.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(auth)/age-gate.tsx`
- `app/(auth)/consent.tsx`
- `app/(auth)/placement.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/practice.tsx`
- `app/(tabs)/leagues.tsx`
- `app/(tabs)/profile.tsx`
- `app/legal/privacy.tsx`
- `app/legal/terms.tsx`
- `app/legal/contact.tsx`
- `app/legal/delete-account.tsx`
- `app/lesson/[id].tsx`
- `app/paywall.tsx`

## Content (6 JSON files in `content/seed/`)
- `content/seed/units.json` ✓ provided
- `content/seed/lessons.json` ✓ provided (45 lessons)
- `content/seed/placement_questions.json` ✓ provided
- `content/seed/words.json` ⚠️ generated via MEGA_PROMPT.md
- `content/seed/lesson_items.json` ⚠️ generated via MEGA_PROMPT.md
- `content/seed/distractors.json` ⚠️ generated via MEGA_PROMPT.md

## Scripts (1)
- `scripts/push-content.ts`

## Docs (3)
- `README.md`
- `MEGA_PROMPT.md`
- `FILES_LIST.md` (this file)
