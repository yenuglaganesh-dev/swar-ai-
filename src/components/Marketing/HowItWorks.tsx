import { motion, useReducedMotion } from 'framer-motion';
import { Languages, Mic, Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Reveal from './Reveal';

export default function HowItWorks() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const steps = [
    { icon: Languages, title: t('how1Title'), desc: t('how1Desc'), n: '01' },
    { icon: Mic, title: t('how2Title'), desc: t('how2Desc'), n: '02' },
    { icon: Volume2, title: t('how3Title'), desc: t('how3Desc'), n: '03' },
  ];
  return (
    <section className="section" id="how">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Simple flow</span>
          <h2 className="section-title"><span className="gradient-text">{t('howTitle')}</span></h2>
        </Reveal>
        <div className="steps">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              className="step glass"
              initial={reduce ? false : { opacity: 0, y: 30, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="step-n">{s.n}</div>
              <div className="step-icon"><s.icon size={24} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step-line" aria-hidden />}
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        .center { text-align: center; }
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; position: relative; }
        .step { padding: 32px; border-radius: 24px; position: relative; overflow: visible; transition: transform .3s, border-color .3s; }
        .step:hover { transform: translateY(-4px); border-color: rgba(255,107,53,0.22); }
        .step-n { position: absolute; top: 20px; right: 24px; font-size: 3rem; font-weight: 800; color: rgba(255,107,53,0.12); line-height: 1; }
        .step-icon { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,154,90,0.06)); color: var(--accent); margin-bottom: 20px; border: 1px solid rgba(255,107,53,0.12); }
        .step h3 { margin: 0 0 10px; font-size: 1.25rem; }
        .step p { margin: 0; color: var(--text-muted); line-height: 1.7; }
        .step-line { display: none; }
        @media (min-width: 861px) { .step-line { display: block; position: absolute; top: 56px; right: -30px; width: 40px; height: 1px; background: linear-gradient(90deg, rgba(255,107,53,0.4), transparent); } }
        @media (max-width: 860px) { .steps { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
