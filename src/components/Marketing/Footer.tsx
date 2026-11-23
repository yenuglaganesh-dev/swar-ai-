import { Mic } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="brand-mark"><Mic size={18} /></span>
          <span>{t('appName')}</span>
        </div>
        <p className="footer-msg">{t('footerMessage')}</p>
        <p className="footer-copy">© {new Date().getFullYear()} SWAR AI</p>
      </div>
      <style>{`
        .footer { padding: 48px 0 56px; border-top: 1px solid rgba(255,255,255,0.06); }
        .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
        .footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.25rem; }
        .footer-brand .brand-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #111; }
        .footer-msg { margin: 0; font-size: 1.05rem; color: #ddd; }
        .footer-copy { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
      `}</style>
    </footer>
  );
}
