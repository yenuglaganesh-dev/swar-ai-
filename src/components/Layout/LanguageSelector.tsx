import { LanguageCode } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const LANGS: { code: LanguageCode; label: string; description: string }[] = [
  { code: 'en-IN', label: 'English', description: 'English' },
  { code: 'te-IN', label: 'Telugu', description: 'తెలుగు' },
  { code: 'hi-IN', label: 'Hindi', description: 'हिन्दी' },
];

interface Props {
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, showTitle = false, className = '' }: Props) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`lang-selector-wrap ${className}`.trim()}>
      {showTitle && (
        <div className="lang-selector-copy">
          <p className="lang-selector-kicker">Language selection</p>
          <h2 className="lang-selector-title">Select Your Language</h2>
          <p className="lang-selector-subtitle">Choose the language you want to use throughout SWAR AI.</p>
          <p className="lang-selector-current">Current language: <strong>{LANGS.find((l) => l.code === language)?.label || 'English'}</strong></p>
        </div>
      )}
      <div className={`lang-selector ${compact ? 'compact' : ''}`} role="radiogroup" aria-label="Language selection">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={language === l.code}
            className={`lang-btn ${language === l.code ? 'active' : ''}`}
            onClick={() => setLanguage(l.code)}
          >
            <span className="lang-btn-label">{l.label}</span>
            {!compact && l.description !== l.label && <span className="lang-btn-native">{l.description}</span>}
          </button>
        ))}
      </div>
      <style>{`
        .lang-selector { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }
        .lang-btn { padding: 10px 16px; border-radius: 999px; font-size: 0.92rem; font-weight: 500; color: var(--text-muted); transition: all .2s; min-height: 44px; }
        .lang-btn:hover { color: #fff; }
        .lang-btn.active { background: linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,154,90,0.15)); color: #fff; box-shadow: inset 0 0 0 1px rgba(255,107,53,0.4); }
        .lang-selector.compact .lang-btn { padding: 8px 12px; font-size: 0.85rem; min-height: 38px; }
        @media (max-width: 520px) { .lang-btn { padding: 8px 10px; font-size: 0.82rem; } }
      `}</style>
    </div>
  );
}
