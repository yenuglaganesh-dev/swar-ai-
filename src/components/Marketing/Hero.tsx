import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, Sparkles, AudioLines } from 'lucide-react';
import SwarAICircle from '@/components/Mascot/SwarAICircle';
import { useLanguage } from '@/context/LanguageContext';
import { useRef } from 'react';

export default function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0.65]);

  return (
    <section className="hero section" id="top" ref={ref}>
      <div className="hero-bg" aria-hidden>
        <div className="hero-arc" />
        <div className="hero-arc-glow" />
        <div className="hero-light hero-light-a" />
        <div className="hero-light hero-light-b" />
        <div className="hero-grid-lines" />
      </div>

      <motion.div className="container hero-grid" style={{ y, opacity: contentOpacity }}>
        <div className="hero-copy">
          <motion.div className="hero-badge" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}>
            <Sparkles size={16} /> {t('tagline')}
          </motion.div>
          <motion.h1 className="hero-title" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
            <span className="gradient-text">{t('heroTitle')}</span>
          </motion.h1>
          <motion.p className="hero-sub" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            {t('heroDesc')}
          </motion.p>
          <motion.div className="hero-actions" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }}>
            <Link to="/assistant" className="btn btn-primary btn-lg hero-cta"><Mic size={20} />{t('startTalking')}</Link>
            <a href="#features" className="btn btn-secondary btn-lg">{t('seeFeatures')}</a>
          </motion.div>
          <motion.div className="hero-langs" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <span>English</span><span className="dot" /><span>తెలుగు</span><span className="dot" /><span>हिन्दी</span>
          </motion.div>
        </div>

        <motion.div className="hero-visual" initial={reduce ? false : { opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <div className="preview-float">
            <div className="preview-glow" aria-hidden />
            <div className="assistant-preview glass">
              <div className="preview-top">
                <div className="preview-dots"><span /><span /><span /></div>
                <div className="preview-badge"><span className="status-dot" /> {t('appName')}</div>
              </div>
              <div className="preview-orb-wrap">
                <div className="preview-mascot"><SwarAICircle size={180} /></div>
              </div>
              <div className="preview-wave" aria-hidden>
                {Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.06}s`, height: `${20 + Math.abs(Math.sin(i * 0.55)) * 80}%` }} />)}
              </div>
              <div className="preview-msg glass">
                <AudioLines size={16} className="accent" />
                <div>
                  <div className="preview-msg-title">{t('assistant')}</div>
                  <div className="preview-msg-text">{t('assistantGreeting')}</div>
                </div>
              </div>
              <div className="preview-mic"><Mic size={22} /></div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .hero { padding-top: 150px; padding-bottom: 100px; overflow: clip; position: relative; min-height: 100vh; display: flex; align-items: center; }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .hero-arc { position: absolute; top: -28vw; left: 50%; width: min(110vw, 1400px); aspect-ratio: 1; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle at 50% 65%, rgba(255,107,53,0.22), rgba(255,107,53,0.06) 45%, transparent 68%); }
        .hero-arc::before { content: ''; position: absolute; inset: 18%; border-radius: 50%; border: 1px solid rgba(255,107,53,0.18); box-shadow: 0 -20px 120px rgba(255,107,53,0.12), inset 0 1px 0 rgba(255,154,90,0.25); }
        .hero-arc-glow { position: absolute; top: -10%; left: 50%; width: 70%; height: 55%; transform: translateX(-50%); background: radial-gradient(ellipse at center, rgba(255,107,53,0.2), transparent 70%); filter: blur(20px); }
        .hero-light { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.55; mix-blend-mode: screen; }
        .hero-light-a { width: 280px; height: 280px; top: 10%; left: 20%; background: rgba(255,154,90,0.18); animation: driftA 14s ease-in-out infinite; }
        .hero-light-b { width: 220px; height: 220px; top: 15%; right: 15%; background: rgba(255,107,53,0.15); animation: driftB 18s ease-in-out infinite; }
        .hero-grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000, transparent 75%); }
        .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; position: relative; z-index: 1; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.25); color: #ffd2c2; font-size: 0.92rem; margin-bottom: 24px; backdrop-filter: blur(8px); }
        .hero-title { font-size: clamp(2.8rem, 6.2vw, 5.4rem); line-height: 0.98; margin: 0 0 24px; letter-spacing: -0.04em; max-width: 720px; }
        .hero-sub { font-size: 1.15rem; line-height: 1.75; color: var(--text-muted); margin: 0 0 32px; max-width: 600px; }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 28px; }
        .hero-cta { box-shadow: 0 12px 40px rgba(255,107,53,0.4), 0 0 0 1px rgba(255,154,90,0.2); }
        .hero-cta:hover { box-shadow: 0 18px 50px rgba(255,107,53,0.55), 0 0 0 1px rgba(255,154,90,0.35); }
        .hero-langs { display: flex; align-items: center; gap: 12px; color: #d0d0d0; font-size: 0.95rem; }
        .hero-langs .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
        .hero-visual { position: relative; min-height: 520px; display: flex; align-items: center; justify-content: center; }
        .preview-float { position: relative; animation: float 7s ease-in-out infinite; }
        .preview-glow { position: absolute; inset: -10%; border-radius: 40px; background: radial-gradient(circle at 50% 40%, rgba(255,107,53,0.28), transparent 65%); filter: blur(30px); }
        .assistant-preview { position: relative; width: min(400px, 86vw); padding: 24px; border-radius: 28px; background: linear-gradient(180deg, rgba(20,20,20,0.85), rgba(12,12,12,0.75)); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,107,53,0.08), inset 0 1px 0 rgba(255,255,255,0.06); }
        .assistant-preview::before { content: ''; position: absolute; inset: -1px; border-radius: 29px; padding: 1px; background: linear-gradient(160deg, rgba(255,107,53,0.45), transparent 35%, transparent 65%, rgba(255,154,90,0.2)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .preview-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .preview-dots { display: flex; gap: 6px; } .preview-dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.18); } .preview-dots span:first-child { background: rgba(255,107,53,0.7); }
        .preview-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #ddd; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); }
        .preview-orb-wrap { position: relative; width: 200px; height: 200px; margin: 0 auto 20px; display: grid; place-items: center; }
        .preview-mascot { width: 180px; height: 180px; display: grid; place-items: center; z-index: 1; filter: drop-shadow(0 18px 40px rgba(255,107,53,0.35)); }
        .preview-wave { display: flex; align-items: center; justify-content: center; gap: 4px; height: 52px; margin-bottom: 20px; }
        .preview-wave span { width: 4px; border-radius: 4px; background: linear-gradient(180deg, var(--accent-2), var(--accent)); animation: wave 1s ease-in-out infinite alternate; transform-origin: center; opacity: 0.9; }
        .preview-msg { display: flex; gap: 12px; padding: 14px; border-radius: 16px; align-items: flex-start; margin-bottom: 18px; }
        .preview-msg-title { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .preview-msg-text { font-size: 0.92rem; line-height: 1.5; color: #eee; }
        .preview-mic { width: 64px; height: 64px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center; color: #111; background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 12px 35px rgba(255,107,53,0.45); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes wave { from { transform: scaleY(0.35); opacity: 0.5; } to { transform: scaleY(1); opacity: 1; } }
        @keyframes driftA { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px, 20px); } }
        @keyframes driftB { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px, 30px); } }
        @media (max-width: 980px) { .hero { min-height: auto; padding-top: 140px; } .hero-grid { grid-template-columns: 1fr; } .hero-visual { min-height: 440px; } }
        @media (max-width: 520px) { .hero-actions .btn { width: 100%; } .hero-title { font-size: clamp(2.5rem, 11vw, 3.5rem); } }
        @media (prefers-reduced-motion: reduce) { .preview-float, .preview-ring, .preview-wave span, .hero-light { animation: none !important; } }
      `}</style>
    </section>
  );
}
