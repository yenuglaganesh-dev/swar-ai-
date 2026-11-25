import { Mic, Square, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssistantStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  status: AssistantStatus;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function MicrophoneButton({ status, onClick, disabled, compact = false }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const label = isListening ? t('tapToStop') : isProcessing ? t('processing') : t('tapToSpeak');
  const iconSize = compact ? 18 : 34;
  const stopSize = compact ? 15 : 28;

  return (
    <div className={`mic-wrap ${compact ? 'compact' : ''}`}>
      <motion.button
        type="button"
        className={`mic-btn ${compact ? 'compact' : ''} ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onClick}
        disabled={disabled || isProcessing}
        whileTap={reduce ? undefined : { scale: 0.95 }}
        aria-label={label}
        title={label}
        aria-pressed={isListening}
      >
        {isListening && <span className="pulse-ring" />}
        {isListening && <span className="pulse-ring delay" />}
        <span className="mic-icon">
          {isProcessing ? (
            <Loader2 size={iconSize} className="spin" />
          ) : isListening ? (
            <Square size={stopSize} fill="currentColor" />
          ) : (
            <Mic size={iconSize} />
          )}
        </span>
      </motion.button>

      {!compact && <div className="mic-label">{label}</div>}

      <style>{`
        .mic-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .mic-wrap.compact {
          flex-direction: row;
          gap: 0;
          flex-shrink: 0;
        }
        .mic-btn {
          position: relative;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #111;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 10px 32px rgba(255, 107, 53, 0.42);
          transition: box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .mic-btn.compact {
          width: 42px;
          height: 42px;
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.32);
        }
        .mic-btn:hover:not(:disabled) {
          box-shadow: 0 14px 40px rgba(255, 107, 53, 0.56);
        }
        .mic-btn.compact:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(255, 107, 53, 0.48);
        }
        .mic-btn:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }
        .mic-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .mic-btn.listening {
          background: linear-gradient(135deg, #ff4d4d, #ff6b35);
        }
        .mic-icon {
          position: relative;
          z-index: 2;
          display: grid;
          place-items: center;
        }
        .pulse-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(255, 107, 53, 0.6);
          animation: mic-pulse 1.8s ease-out infinite;
        }
        .mic-btn.compact .pulse-ring {
          inset: -3px;
        }
        .pulse-ring.delay {
          animation-delay: 0.6s;
        }
        .mic-label {
          font-size: 0.92rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .spin {
          animation: mic-spin 1s linear infinite;
        }
        @keyframes mic-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes mic-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-ring,
          .spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
