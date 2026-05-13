# Cesta — Czech Language Learning App

Production-ready gamified Czech learning app (A1 → B1). Expo + Supabase + RevenueCat.
**Audio is generated on-device using the system Czech voice — no audio files to host.**

## Compliance (built-in)

- Privacy Policy + Terms with full content
- Contact Us with mailto + diagnostics
- Account deletion (export data / 30-day schedule / delete now)
- Age gate with under-13 auto-delete
- Granular consent (terms + privacy required; analytics + marketing optional)
- App Tracking Transparency (iOS) — fires after privacy consent
- Notification permission requested after consent (Apple-friendly context)
- Consent audit log (immutable, security-definer RPC)
- GDPR data export (returns JSON)
- Subscription auto-renewal disclosure on paywall
- `ITSAppUsesNonExemptEncryption=false` declared
- No microphone permission (Apple won't ask why we need it)

## Daily reminders (local notifications)

Three reminders at peak free-time slots in the user's local time:
- **08:00 — morning** ☕ (coffee/commute window)
- **12:30 — lunch break** 🍜
- **19:30 — evening** 🔥 (streak rescue before bed)

Smart behavior:
- Permission requested once during the consent flow
- Messages rotate to avoid notification blindness (4 variations per slot, EN + CZ)
- **When user completes daily goal, today's remaining reminders are cancelled** — they only fire on days the user hasn't already practiced
- Pre-scheduled 14 days out so reminders work even if the app isn't opened
- Each slot is individually toggleable in Profile › Daily reminders
- Master toggle disables all three
- Signing out / deleting account cancels everything

## Quick start (in order)

### 1. Create the project shell
```bash
npx create-expo-app cesta --template blank-typescript
cd cesta
```

### 2. Copy this code over the template
Extract `cesta.zip` and copy every file into your project at the matching path.
**Keep the `assets/` folder** that the template created — it has default icons.

### 3. Install dependencies (let Expo align versions to your SDK)
```bash
# Expo-managed packages:
npx expo install @react-native-async-storage/async-storage expo-application \
  expo-constants expo-device expo-haptics expo-linking expo-localization \
  expo-notifications expo-router expo-secure-store expo-speech \
  expo-splash-screen expo-status-bar expo-system-ui expo-tracking-transparency \
  expo-web-browser react-native-gesture-handler react-native-reanimated \
  react-native-safe-area-context react-native-screens react-native-svg \
  react-native-url-polyfill

# Non-Expo packages:
npm install @supabase/supabase-js @tanstack/react-query react-native-purchases \
  zod zustand

# Dev:
npm install -D dotenv tsx
```

### 4. Configure environment
```bash
cp .env.example .env
# Fill in:
#   EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
#   EXPO_PUBLIC_RC_IOS + EXPO_PUBLIC_RC_ANDROID
#   EXPO_PUBLIC_COMPANY_NAME / EMAIL / PRIVACY_EMAIL / ADDRESS / WEBSITE
#   SUPABASE_SERVICE_ROLE_KEY (used ONLY by content push script — keep secret)
```

### 5. Run the database migration
Supabase dashboard › SQL Editor › paste contents of
`supabase/migrations/20260512000000_initial_schema.sql` › Run

### 6. Disable email confirmation (or keep on — your choice)
Default Supabase requires users to click a confirmation email before they can sign in.
For a smoother demo experience, disable it:
- Supabase dashboard › Authentication › Providers › Email
- Uncheck "Confirm email"

(For production, leaving it on is more secure but adds friction.)

### 7. Generate the 2,500-word content
- Open a fresh Claude conversation (Claude.ai, ideally Opus)
- Paste the entire contents of `MEGA_PROMPT.md`
- Claude responds in batches. Reply "Continue, same format, no repeats" between batches until 2,500.
- Save the three JSON arrays to:
  - `content/seed/words.json`
  - `content/seed/lesson_items.json`
  - `content/seed/distractors.json`

### 8. Push content to Supabase
```bash
npm run content:push
```

### 9. Run it
```bash
npm start
# Press i for iOS simulator, a for Android
```

## How the audio works

There are no MP3 files. The app calls the device's built-in Czech text-to-speech voice:
- **iOS:** Ships with "Zuzana" Czech voice. Works immediately. High quality.
- **Android:** Czech TTS via Google Speech Services. Most devices have it; if not, the app shows a hint to install it (Settings → System → Languages → Text-to-speech).

When a lesson plays, `expo-speech` reads `word.cs` aloud in cs-CZ at a slightly slower rate (0.9× normal) for learner comprehension.

## App Store / Play Store submission checklist

### Apple (App Store Connect)
- [ ] App icon (1024×1024), launch screen, screenshots (6.7" required, 5.5" optional)
- [ ] App Privacy nutrition labels:
  - Email Address — linked to identity, App Functionality
  - User ID — linked to identity, App Functionality
  - Usage Data — NOT linked, Analytics (only if user opts in)
  - Crash Data — NOT linked, App Functionality
- [ ] **Privacy Policy URL** — also host content publicly (e.g. cesta.app/privacy)
- [ ] Support URL (cesta.app/contact)
- [ ] Terms URL in metadata (cesta.app/terms)
- [ ] App Tracking Transparency — prompt wired after consent ✓
- [ ] Account deletion — in-app ✓
- [ ] Subscription disclosures on paywall ✓
- [ ] Encryption — `ITSAppUsesNonExemptEncryption=false` ✓
- [ ] No microphone permission requested ✓

### Google (Play Console)
- [ ] **Privacy Policy URL** — required, must be publicly hosted
- [ ] Content rating questionnaire
- [ ] Data safety form — match what's in privacy.tsx
- [ ] Account deletion: in-app declaration ✓
- [ ] Subscription products configured

### Important: hosting your privacy/terms publicly
Both stores **require a publicly accessible URL** for your privacy policy and terms.
The in-app screens satisfy iOS/Android runtime requirements, but the submission form
needs URLs. Easy fix: deploy a simple static site (Vercel, GitHub Pages, your domain)
with `/privacy` and `/terms` pages containing the same content as the in-app screens.

### Build & submit
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

## Project structure

```
cesta/
├─ app/                       expo-router screens
│  ├─ _layout.tsx             root + auth/consent routing guard + voice check
│  ├─ (auth)/                 sign-in, sign-up, age-gate, consent, placement
│  ├─ (tabs)/                 path, practice, leagues, profile
│  ├─ legal/                  privacy, terms, contact, delete-account (modal)
│  ├─ lesson/[id].tsx         lesson runner
│  └─ paywall.tsx
├─ components/                UI, gamification, exercises
├─ lib/
│  ├─ speech.ts               System TTS — pick best Czech voice, speak at learner rate
│  ├─ supabase.ts, srs.ts, store.ts, theme.ts, haptics.ts...
│  └─ tracking.ts, revenuecat.ts, text.ts, company.ts
├─ content/seed/              JSON content
├─ scripts/push-content.ts    Service-role uploader
└─ supabase/migrations/       Schema (incl. account deletion RPCs)
```

## Troubleshooting

**TTS says nothing on Android emulator** — emulators sometimes lack TTS engines. Test on a real device.

**Czech words sound English** — system doesn't have Czech voice installed. The app shows a one-time hint on first launch. iOS users: voice is built in. Android: install from Settings → Languages → Text-to-speech.

**Routing loops** — check that `LEGAL_VERSIONS.privacy` and `.terms` in `lib/company.ts` match what's stored in `profiles.terms_accepted_version` / `privacy_accepted_version`. Bumping versions forces re-prompt.

**Sign-up navigates back to sign-in** — Supabase email confirmation is on (see step 6).

## License
© 2026. All rights reserved.
