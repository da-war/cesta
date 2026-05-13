# MEGA PROMPT — Generate 2,500 Czech Words for Cesta

Open a fresh Claude conversation (Claude.ai, ideally Claude Opus). Paste the entire prompt below.
The output will be three JSON files you save to `content/seed/`.

> **TIP:** Claude won't finish 2,500 words in one response. After it stops, reply:
> "Continue from where you left off. Same exact JSON format. Do not repeat earlier entries."
> Repeat until you reach 2500 words.

---

## PROMPT TO PASTE BELOW (copy everything between the lines)

---

You are generating curated Czech vocabulary content for a production language-learning mobile app
called **Cesta**. The app uses the device's built-in Czech text-to-speech voice (no audio files),
so you do NOT need to generate audio URLs — leave `audio_path` as `null`.

## What I need

Three JSON arrays (output as code blocks, not prose):

### 1. `words.json` — 2,500 entries

Each entry has this exact shape:

```json
{
  "id": "w_a10_001",
  "cs": "ahoj",
  "en": "hi / hello (informal)",
  "ipa": "ˈaɦoj",
  "audio_path": null,
  "pos": "interj",
  "gender": null,
  "cefr": "A1.0",
  "frequency_rank": 12,
  "notes": "Used among friends, peers, and people you know well. Not formal.",
  "example_cs": "Ahoj, jak se máš?",
  "example_en": "Hi, how are you?"
}
```

### 2. `lesson_items.json` — maps words to lessons

```json
{
  "lesson_id": "l_a1_0_1",
  "word_id": "w_a10_001",
  "display_order": 1,
  "exercise_types": ["flashcard", "tap_match", "listen", "type"]
}
```

### 3. `distractors.json` — wrong-answer pool for multiple-choice

```json
{ "word_id": "w_a10_001", "wrong_en": "bye" },
{ "word_id": "w_a10_001", "wrong_en": "thanks" },
{ "word_id": "w_a10_001", "wrong_en": "please" }
```

## Field rules

**`id`** — format: `w_<level_compressed>_<3-digit-sequence>` where level_compressed is the CEFR sub-band with no dot: a10, a11, a12, a20, a21, a22, b10, b11, b12. Sequence is unique per level. Example: `w_a10_001`, `w_a10_002`.

**`cs`** — Czech word in dictionary form (nominative singular for nouns, infinitive for verbs). Include diacritics correctly: á č ď é ě í ň ó ř š ť ú ů ý ž. THIS is what gets spoken aloud by the system TTS, so accuracy matters.

**`en`** — English meaning. If multiple meanings, use `/` separators with register hints in parens. Examples: `"to be"`, `"hi / hello (informal)"`, `"car"`, `"to want / would like"`.

**`ipa`** — IPA pronunciation, no brackets/slashes — just the symbols. Always include primary stress (ˈ). Example: `ˈaɦoj`, `ˈmɔst`.

**`audio_path`** — ALWAYS `null`. The app uses on-device TTS, not files.

**`pos`** — `noun`, `verb`, `adj`, `adv`, `prep`, `conj`, `pron`, `num`, `interj`, `particle`, `phrase`.

**`gender`** — nouns only: `m`, `ma`, `mi`, `f`, `n`. Non-nouns: `null`.

**`cefr`** — `A1.0`, `A1.1`, `A1.2`, `A2.0`, `A2.1`, `A2.2`, `B1.0`, `B1.1`, `B1.2`.

**`frequency_rank`** — integer rank in Czech corpus (lower = more common). Approximate is fine. Range roughly 1–10000.

**`notes`** — optional usage notes. One sentence max. `null` if not useful.

**`example_cs` / `example_en`** — required. A short natural sentence using the word, at or below the word's CEFR level. Under 10 Czech words. Realistic.

## Distribution (2,500 words total)

| CEFR | Count | Theme |
|------|-------|-------|
| A1.0 | 100 | Survival: greetings, please/thank you, yes/no, numbers, colors |
| A1.1 | 200 | Family, pronouns, "to be"/"to have", basic verbs, days |
| A1.2 | 300 | Food, drink, time, transport, weather, basic adjectives |
| A2.0 | 300 | Shopping, restaurant, directions, money, professions |
| A2.1 | 350 | Past tense, travel, hobbies, body, health |
| A2.2 | 350 | Opinions, comparisons, conditionals, emotions |
| B1.0 | 300 | Work, studies, formal communication, abstract concepts |
| B1.1 | 300 | Culture, current events, media, environment |
| B1.2 | 300 | Idioms, register, nuance, complex grammar |
| **Total** | **2,500** | |

## Selection rules

1. **No duplicates.** Each Czech word appears once.
2. **Frequency-first.** Within each band, most common words first.
3. **Useful, not weird.** Skip archaic. Include what learners actually encounter.
4. **Cover word classes.** ~40% nouns, 25% verbs, 15% adj, 10% adv, 10% other per band.
5. **Cognates okay.** auto, telefon, hotel build early confidence.
6. **No vulgar/offensive words.** Skip anything that fails App Store review.
7. **TTS-friendly.** Avoid orthography that produces wonky pronunciation in the system voice (e.g. very rare loanwords with non-Czech spellings).

## Lesson mapping (`lesson_items.json`)

45 lessons across 9 units (5 lessons per unit). The app shows ~8 words per session and lessons
are replayable, so you can map more words than fit in one session.

Lesson IDs (already in `content/seed/lessons.json`):

- **u_a1_0_basics** (A1.0): l_a1_0_1 → l_a1_0_5 → ~20 words each
- **u_a1_1_people** (A1.1): l_a1_1_1 → l_a1_1_5 → ~40 words each
- **u_a1_2_daily** (A1.2): l_a1_2_1 → l_a1_2_5 → ~60 words each
- **u_a2_0_around** (A2.0): l_a2_0_1 → l_a2_0_5 → ~60 words each
- **u_a2_1_past** (A2.1): l_a2_1_1 → l_a2_1_5 → ~70 words each
- **u_a2_2_opinions** (A2.2): l_a2_2_1 → l_a2_2_5 → ~70 words each
- **u_b1_0_work** (B1.0): l_b1_0_1 → l_b1_0_5 → ~60 words each
- **u_b1_1_culture** (B1.1): l_b1_1_1 → l_b1_1_5 → ~60 words each
- **u_b1_2_nuance** (B1.2): l_b1_2_1 → l_b1_2_5 → ~60 words each

For `exercise_types`, default to `["flashcard", "tap_match", "listen", "type"]`. For especially
hard/abstract words, drop `"type"`.

For `display_order`, number each word within a lesson starting at 1.

## Distractors (`distractors.json`)

3 distractors per word. Rules:
- Plausible — same semantic family (for "mother": "sister, aunt, grandmother")
- Same part of speech
- Same approximate CEFR level
- Never offensive

## Output format

Three large JSON arrays inside three fenced code blocks, in this order:

1. ```json (words.json) [ ...word objects... ] ```
2. ```json (lesson_items.json) [ ...mapping objects... ] ```
3. ```json (distractors.json) [ ...distractor objects... ] ```

Compact JSON. No commentary inside code blocks. Outside the blocks you may say one line of status
(e.g. "Generated A1.0 + A1.1 = 300 words. Continue?").

## Quality bar

- Czech diacritics correct ✓
- IPA accurate (h = /ɦ/, ch = /x/, ř = /r̝/) ✓
- Examples are what a Czech speaker would actually say ✓
- Translations capture register ✓
- No duplicate IDs ✓
- No duplicate Czech words ✓
- Every word_id in lesson_items.json and distractors.json exists in words.json ✓
- audio_path is always null ✓

## Start

Begin with A1.0 (100 words). After each CEFR band, pause and ask if I want you to continue.
Keep IDs strictly sequential. Begin now.
