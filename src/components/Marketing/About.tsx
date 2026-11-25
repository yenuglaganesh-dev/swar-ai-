import { Mic, Globe, Shield } from 'lucide-react';
import Reveal from './Reveal';
import { useLanguage } from '@/context/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  return (
    <section className="section" id="about">
      <div className="container about-grid">
        <Reveal>
          <span className="eyebrow">{t('aboutEyebrow')}</span>
          <h2 className="section-title"><span className="gradient-text">{t('mission')}</span></h2>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            {t('aboutDesc')}
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
            {t('aboutDesc2')}
          </p>
        </Reveal>
        <Reveal delay={0.12} className="about-cards">
          {[
            { icon: Mic, title: t('aboutVoiceTitle'), desc: t('aboutVoiceDesc') },
            { icon: Globe, title: t('aboutLangTitle'), desc: t('aboutLangDesc') },
            { icon: Shield, title: t('aboutPrivacyTitle'), desc: t('aboutPrivacyDesc') },
          ].map((c) => (
            <div key={c.title} className="about-card glass">
              <div className="about-icon"><c.icon size={20} /></div>
              <div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
      <style>{`
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .about-cards { display: flex; flex-direction: column; gap: 16px; }
        .about-card { display: flex; gap: 16px; padding: 24px; border-radius: 20px; transition: transform .3s, border-color .3s; }
        .about-card:hover { transform: translateY(-3px); border-color: rgba(255,107,53,0.25); }
        .about-icon { width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px; display: grid; place-items: center; color: var(--accent); background: rgba(255,107,53,0.12); }
        .about-card h3 { margin: 0 0 6px; font-size: 1.05rem; }
        .about-card p { margin: 0; color: var(--text-muted); line-height: 1.65; font-size: 0.95rem; }
        @media (max-width: 860px) { .about-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
