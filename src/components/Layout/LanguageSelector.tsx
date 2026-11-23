import { LanguageCode } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'en-IN', label: 'English' },
];

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const { updateSettings } = useSettings();

  return (
    <div className={`lang-selector ${compact ? 'compact' : ''}`} role="radiogroup" aria-label={t('language')}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          role="radio"
          aria-checked={language === l.code}
          className={`lang-btn ${language === l.code ? 'active' : ''}`}
          onClick={() => { setLanguage(l.code); updateSettings({ preferredLanguage: l.code }); }}
        >
          {l.label}
        </button>
      ))}
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
