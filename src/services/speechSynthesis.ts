import { LanguageCode } from '@/types';

export interface SpeakOptions {
  lang: LanguageCode;
  rate?: number;
  voicePreference?: 'female' | 'default';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: unknown) => void;
}

const FEMALE_HINTS = ['female', 'woman', 'zira', 'samantha', 'victoria', 'karen', 'veena', 'lekha', 'swara', 'nishi', 'aditi', 'kalpana', 'heera', 'google हिन्दी', 'google telugu'];

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function waitForVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve([]);
  const existing = getVoices();
  if (existing.length) return Promise.resolve(existing);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(getVoices());
    };
    const timer = setTimeout(finish, timeoutMs);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      finish();
    };
  });
}

function scoreVoice(voice: SpeechSynthesisVoice, lang: LanguageCode, preference: 'female' | 'default'): number {
  let score = 0;
  const vLang = (voice.lang || '').toLowerCase();
  const target = lang.toLowerCase();
  const base = target.split('-')[0];
  if (vLang === target) score += 100;
  else if (vLang.startsWith(base)) score += 70;
  else if (vLang.includes(base)) score += 40;

  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (preference === 'female') {
    if (FEMALE_HINTS.some((h) => name.includes(h))) score += 20;
    if (name.includes('female')) score += 10;
  }
  if (voice.localService) score += 2;
  if (voice.default) score += 1;
  return score;
}

export async function pickVoice(lang: LanguageCode, preference: 'female' | 'default' = 'female'): Promise<SpeechSynthesisVoice | null> {
  const voices = await waitForVoices();
  if (!voices.length) return null;
  const ranked = [...voices]
    .map((v) => ({ v, score: scoreVoice(v, lang, preference) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) return null;
  // If no language match, return null to let browser decide? Better return best only if it matches base.
  const base = lang.split('-')[0].toLowerCase();
  if ((best.v.lang || '').toLowerCase().includes(base)) return best.v;
  return null;
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export async function speakText(text: string, options: SpeakOptions): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.(new Error('TTS_NOT_SUPPORTED'));
    return;
  }
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = 1;
  const voice = await pickVoice(options.lang, options.voicePreference ?? 'female');
  if (voice) utterance.voice = voice;

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => options.onError?.(e);

  window.speechSynthesis.speak(utterance);
}
