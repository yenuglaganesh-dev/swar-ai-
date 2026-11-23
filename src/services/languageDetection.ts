import { LanguageCode } from '@/types';

const TELUGU_RE = /[\u0C00-\u0C7F]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/; // Hindi/Devanagari

export function detectLanguageFromText(text: string): LanguageCode | null {
  if (!text) return null;
  const telugu = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const hindi = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;

  if (telugu === 0 && hindi === 0 && latin === 0) return null;
  if (telugu > hindi && telugu > latin) return 'te-IN';
  if (hindi > telugu && hindi > latin) return 'hi-IN';
  if (latin > telugu && latin > hindi) return 'en-IN';

  // Mixed/unclear
  if (TELUGU_RE.test(text)) return 'te-IN';
  if (DEVANAGARI_RE.test(text)) return 'hi-IN';
  if (/[A-Za-z]/.test(text)) return 'en-IN';
  return null;
}

export function languageLabel(code: LanguageCode): string {
  if (code === 'te-IN') return 'తెలుగు';
  if (code === 'hi-IN') return 'हिन्दी';
  return 'English';
}
