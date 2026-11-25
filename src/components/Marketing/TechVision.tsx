import { Cpu, Waves, Database, Sparkles } from 'lucide-react';
import Reveal from './Reveal';
import { useLanguage } from '@/context/LanguageContext';

export default function TechVision() {
  const { t } = useLanguage();
  const tech = [
    { icon: Waves, title: t('techSpeechTitle'), desc: t('techSpeechDesc') },
    { icon: Cpu, title: t('techAiTitle'), desc: t('techAiDesc') },
    { icon: Database, title: t('techDataTitle'), desc: t('techDataDesc') },
    { icon: Sparkles, title: t('techFrontendTitle'), desc: t('techFrontendDesc') },
  ];
  return (
    <section className="section" id="technology">
      <div className="container">
        <div className="tech-vision-grid">
          <Reveal>
            <span className="eyebrow">{t('navTechnology')}</span>
            <h2 className="section-title"><span className="gradient-text">{t('techVisionTitle')}</span></h2>
            <p className="section-subtitle">{t('techSubtitle')}</p>
            <div className="tech-list">
              {tech.map((t, i) => (
                <Reveal key={t.title} delay={i * 0.06} className="tech-item">
                  <div className="tech-icon"><t.icon size={20} /></div>
                  <div><h3>{t.title}</h3><p>{t.desc}</p></div>
                </Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15} className="vision-card glass">
            <span className="eyebrow">{t('visionEyebrow')}</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', margin: '0 0 20px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              <span className="gradient-text">{t('visionTitle')}</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, margin: '0 0 24px' }}>
              {t('visionDesc')}
            </p>
            <div className="vision-wave" aria-hidden>
              {Array.from({ length: 32 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.05}s`, height: `${18 + Math.abs(Math.sin(i * 0.4)) * 82}%` }} />)}
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .tech-vision-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: stretch; }
        .tech-list { margin-top: 32px; display: flex; flex-direction: column; gap: 18px; }
        .tech-item { display: flex; gap: 14px; }
        .tech-icon { width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px; display: grid; place-items: center; color: var(--accent); background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.12); }
        .tech-item h3 { margin: 0 0 4px; font-size: 1rem; } .tech-item p { margin: 0; color: var(--text-muted); font-size: 0.93rem; line-height: 1.65; }
        .vision-card { padding: 40px; border-radius: 28px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
        .vision-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,107,53,0.12), transparent 70%); pointer-events: none; }
        .vision-wave { display: flex; align-items: end; gap: 4px; height: 72px; margin-top: auto; padding-top: 16px; }
        .vision-wave span { flex: 1; border-radius: 4px; background: linear-gradient(180deg, var(--accent-2), rgba(255,107,53,0.25)); animation: wave 1.2s ease-in-out infinite alternate; }
        @keyframes wave { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        @media (max-width: 900px) { .tech-vision-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .vision-wave span { animation: none; transform: scaleY(0.7); } }
      `}</style>
    </section>
  );
}
