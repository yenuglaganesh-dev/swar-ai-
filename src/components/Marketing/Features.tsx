import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Languages, GraduationCap, Languages as TranslateIcon, FileText, Search, Brain, CheckSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Reveal from './Reveal';

export default function Features() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const items = [
    { icon: Mic, title: t('featureVoiceTitle'), desc: t('featureVoiceDesc') },
    { icon: Languages, title: t('featureLangTitle'), desc: t('featureLangDesc') },
    { icon: GraduationCap, title: t('tutorMode'), desc: t('tutorModeDesc') },
    { icon: TranslateIcon, title: t('translateMode'), desc: t('solution4') },
    { icon: FileText, title: t('uploadDocument'), desc: t('documentHint') },
    { icon: Search, title: t('featureSmartTitle'), desc: t('featureSmartDesc') },
    { icon: Brain, title: t('memory'), desc: t('memoryConsentDesc') },
    { icon: CheckSquare, title: t('dashboard'), desc: t('dashboardIntro') },
  ];

  return (
    <section className="section" id="features">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">SWAR AI</span>
          <h2 className="section-title"><span className="gradient-text">{t('featuresTitle')}</span></h2>
          <p className="section-subtitle">{t('featuresSubtitle')}</p>
        </Reveal>
        <div className="features-grid">
          {items.map((item, i) => (
            <motion.article
              key={item.title}
              className="feature-card glass"
              initial={reduce ? false : { opacity: 0, y: 30, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? undefined : { y: -6, transition: { duration: 0.25 } }}
            >
              <div className="feature-glow" aria-hidden />
              <div className="feature-icon"><item.icon size={24} /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
      <style>{`
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .section-head { margin-bottom: 52px; }
        .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .feature-card { position: relative; padding: 30px; border-radius: 22px; overflow: hidden; transition: border-color .3s, box-shadow .3s; }
        .feature-card::before { content: ''; position: absolute; inset: 0; border-radius: 22px; padding: 1px; background: linear-gradient(160deg, rgba(255,107,53,0), rgba(255,107,53,0)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; transition: background .4s; pointer-events: none; }
        .feature-card:hover { border-color: rgba(255,107,53,0.2); box-shadow: 0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,107,53,0.1); }
        .feature-card:hover::before { background: linear-gradient(160deg, rgba(255,107,53,0.55), rgba(255,154,90,0.1) 40%, transparent 65%); }
        .feature-glow { position: absolute; top: -40px; right: -40px; width: 140px; height: 140px; background: radial-gradient(circle, rgba(255,107,53,0.18), transparent 70%); opacity: 0; transition: opacity .4s; }
        .feature-card:hover .feature-glow { opacity: 1; }
        .feature-icon { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(255,107,53,0.18), rgba(255,107,53,0.06)); color: var(--accent); margin-bottom: 20px; border: 1px solid rgba(255,107,53,0.12); }
        .feature-card h3 { margin: 0 0 10px; font-size: 1.18rem; letter-spacing: -0.01em; }
        .feature-card p { margin: 0; color: var(--text-muted); line-height: 1.7; font-size: 0.96rem; }
        @media (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
