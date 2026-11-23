import { Mic, Square, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssistantStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  status: AssistantStatus;
  onClick: () => void;
  disabled?: boolean;
}

export default function MicrophoneButton({ status, onClick, disabled }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="mic-wrap">
      <motion.button
        className={`mic-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onClick}
        disabled={disabled || isProcessing}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        aria-label={isListening ? t('tapToStop') : t('tapToSpeak')}
        aria-pressed={isListening}
      >
        {isListening && <span className="pulse-ring" />}
        {isListening && <span className="pulse-ring delay" />}
        <span className="mic-icon">
          {isProcessing ? <Loader2 size={36} className="spin" /> : isListening ? <Square size={30} fill="currentColor" /> : <Mic size={36} />}
        </span>
      </motion.button>
      <div className="mic-label">{isListening ? t('tapToStop') : isProcessing ? t('processing') : t('tapToSpeak')}</div>
      <style>{`
        .mic-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .mic-btn { position: relative; width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; color: #111; background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 12px 40px rgba(255,107,53,0.45); transition: box-shadow .2s, transform .2s; }
        .mic-btn:hover:not(:disabled) { box-shadow: 0 16px 50px rgba(255,107,53,0.6); }
        .mic-btn:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
        .mic-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .mic-btn.listening { background: linear-gradient(135deg, #ff4d4d, #ff6b35); }
        .mic-icon { position: relative; z-index: 2; display: grid; place-items: center; }
        .pulse-ring { position: absolute; inset: -8px; border-radius: 50%; border: 2px solid rgba(255,107,53,0.6); animation: pulse 1.8s ease-out infinite; }
        .pulse-ring.delay { animation-delay: 0.6s; }
        .mic-label { font-size: 0.95rem; color: var(--text-muted); font-weight: 500; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .pulse-ring, .spin { animation: none; } }
      `}</style>
    </div>
  );
}
