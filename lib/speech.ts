import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * System TTS for Czech words.
 *
 * Uses expo-speech which wraps:
 *   - iOS:     AVSpeechSynthesizer (built-in "Zuzana" Czech voice ships with iOS)
 *   - Android: Google Text-to-Speech (Czech is downloadable in Settings)
 *
 * No audio files needed.
 */

const LANGUAGE = 'cs-CZ';
const DEFAULT_RATE = 0.9;    // slightly slower than natural for learners
const SLOW_RATE = 0.6;       // for "play slowly" button
const DEFAULT_PITCH = 1.0;

let cachedVoice: string | undefined;
let voiceCheckDone = false;
let czechAvailable: boolean | null = null;

/**
 * Picks the best Czech voice on the device. Prefers Enhanced quality (iOS) when available.
 * Falls back to whatever the system gives us if no exact match.
 */
async function pickBestVoice(): Promise<string | undefined> {
  if (voiceCheckDone) return cachedVoice;
  voiceCheckDone = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const czechVoices = voices.filter((v) => v.language?.toLowerCase().startsWith('cs'));
    czechAvailable = czechVoices.length > 0;
    if (czechVoices.length === 0) {
      console.warn('[speech] No Czech voice installed on device. Falling back to default.');
      return undefined;
    }
    // Prefer Enhanced > Default
    const enhanced = czechVoices.find((v) => v.quality === Speech.VoiceQuality.Enhanced);
    const chosen = enhanced ?? czechVoices[0];
    cachedVoice = chosen?.identifier;
    return cachedVoice;
  } catch (e) {
    console.warn('[speech] voice enumeration failed', e);
    return undefined;
  }
}

/**
 * Speaks Czech text aloud using the system voice.
 * Stops any in-flight speech first so rapid taps don't queue up.
 */
export async function speak(text: string | null | undefined, opts?: { slow?: boolean; onDone?: () => void }) {
  if (!text || text.trim().length === 0) return;
  try {
    // Cancel anything currently speaking
    const isSpeaking = await Speech.isSpeakingAsync().catch(() => false);
    if (isSpeaking) await Speech.stop();
    const voice = await pickBestVoice();
    Speech.speak(text, {
      language: LANGUAGE,
      voice,
      rate: opts?.slow ? SLOW_RATE : DEFAULT_RATE,
      pitch: DEFAULT_PITCH,
      onDone: opts?.onDone,
      onError: (e) => console.warn('[speech] onError', e),
    });
  } catch (e) {
    console.warn('[speech] speak failed', e);
  }
}

export async function stopSpeech() {
  try { await Speech.stop(); } catch {}
}

/**
 * Check if a Czech voice is installed. Run once at app startup; if false,
 * show the user a one-time hint to install it (Android only — iOS ships with one).
 */
export async function isCzechVoiceAvailable(): Promise<boolean> {
  if (czechAvailable !== null) return czechAvailable;
  await pickBestVoice();
  return czechAvailable ?? false;
}

export function platformVoiceHint(): string {
  if (Platform.OS === 'ios') {
    return 'iOS Settings → Accessibility → Spoken Content → Voices → Czech';
  }
  return 'Android Settings → System → Languages → Text-to-speech output → Install Czech voice data';
}
