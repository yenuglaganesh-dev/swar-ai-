import { AssistantStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export default function AssistantStatusBar({ status }: { status: AssistantStatus }) {
  const { t } = useLanguage();
  const label = status === 'listening' ? t('listening')
    : status === 'processing' ? t('processing')
    : status === 'speaking' ? t('speaking')
    : status === 'error' ? t('error')
    : t('idle');

  return (
    <div className={`status-bar status-${status}`} role="status" aria-live="polite">
      <span className="status-indicator" />
      <span>{label}</span>
      <style>{`
        .status-bar { display: inline-flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; color: #ddd; }
        .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #6b7280; }
        .status-listening .status-indicator { background: #ff4d4d; box-shadow: 0 0 0 4px rgba(255,77,77,0.15); animation: blink 1s infinite; }
        .status-processing .status-indicator { background: var(--accent); box-shadow: 0 0 0 4px rgba(255,107,53,0.15); animation: blink 0.8s infinite; }
        .status-speaking .status-indicator { background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.15); animation: blink 0.6s infinite; }
        .status-idle .status-indicator { background: #22c55e; }
        .status-error .status-indicator { background: #ff4d4d; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        @media (prefers-reduced-motion: reduce) { .status-indicator { animation: none !important; } }
      `}</style>
    </div>
  );
}
