import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  suggestions: string[];
  onSelect: (s: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: Props) {
  const { t } = useLanguage();
  if (!suggestions.length) return null;
  return (
    <div className="suggestions" aria-label={t('suggestions')}>
      <div className="suggestions-label"><Sparkles size={13} /> {t('suggestions')}</div>
      <div className="suggestions-list">
        {suggestions.map((s, i) => (
          <button key={`${i}-${s}`} className="chip" onClick={() => onSelect(s)}>{s}</button>
        ))}
      </div>
      <style>{`
        .suggestions { margin-top: 14px; }
        .suggestions-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .suggestions-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .suggestions .chip { font-size: 0.88rem; padding: 8px 14px; min-height: 40px; text-align: left; }
      `}</style>
    </div>
  );
}
