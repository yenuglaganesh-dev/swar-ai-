import { LanguageCode } from '@/types';

export interface RecognitionHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
}

export function createRecognition(lang: LanguageCode, handlers: RecognitionHandlers, continuous = false) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = continuous;
  recognition.maxAlternatives = 1;

  let isRestarting = false;

  recognition.onstart = () => {
    isRestarting = false;
    handlers.onStart?.();
  };
  recognition.onend = () => {
    if (continuous && !isRestarting) {
      isRestarting = true;
      try { recognition.start(); } catch {}
    }
    handlers.onEnd?.();
  };
  recognition.onerror = (e: Event) => {
    const err = (e as unknown as { error?: string }).error || 'recognition_error';
    handlers.onError?.(err);
  };
  recognition.onresult = (event: Event) => {
    const ev = event as unknown as { resultIndex: number; results: SpeechRecognitionResultList };
    let transcript = '';
    let isFinal = false;
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const result = ev.results[i];
      transcript += result[0]?.transcript || '';
      if (result.isFinal) isFinal = true;
    }
    handlers.onResult?.(transcript.trim(), isFinal);
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
      isRestarting = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
      isRestarting = false;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}