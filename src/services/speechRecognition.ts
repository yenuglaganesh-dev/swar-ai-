import { LanguageCode } from '@/types';

export interface RecognitionHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string, isFinal: boolean, meta?: { finalText: string; interimText: string }) => void;
  onError?: (error: string) => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
}

export function createRecognition(lang: LanguageCode, handlers: RecognitionHandlers) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => handlers.onStart?.();
  recognition.onend = () => handlers.onEnd?.();
  recognition.onerror = (e: Event) => {
    const err = (e as unknown as { error?: string }).error || 'recognition_error';
    handlers.onError?.(err);
  };
  recognition.onresult = (event: Event) => {
    const ev = event as unknown as { results: SpeechRecognitionResultList };
    let finalText = '';
    let interimText = '';
    for (let i = 0; i < ev.results.length; i++) {
      const result = ev.results[i];
      const text = result[0]?.transcript || '';
      if (result.isFinal) finalText += text;
      else interimText += text;
    }
    const cleanFinal = finalText.replace(/\s+/g, ' ').trim();
    const cleanInterim = interimText.replace(/\s+/g, ' ').trim();
    const combined = [cleanFinal, cleanInterim].filter(Boolean).join(' ').trim();
    const allFinal = ev.results.length > 0 && cleanInterim.length === 0 && cleanFinal.length > 0;
    handlers.onResult?.(combined, allFinal, { finalText: cleanFinal, interimText: cleanInterim });
  };

  return {
    start() {
      try {
        recognition.start();
      } catch (e) {
        handlers.onError?.('start_failed');
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
