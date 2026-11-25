import { Link } from 'react-router-dom';
import { Mic, Volume2, MessageSquare, Sparkles } from 'lucide-react';
import Reveal from './Reveal';
import { useLanguage } from '@/context/LanguageContext';
import { AudioLines } from 'lucide-react';

export default function LivePreview() {
  const { t } = useLanguage();
  return (
    <section className="section" id="live-preview">
      <div className="container preview-grid">
        <Reveal>
          <span className="eyebrow">{t('previewEyebrow')}</span>
          <h2 className="section-title"><span className="gradient-text">{t('livePreviewTitle')}</span></h2>
          <p className="section-subtitle" style={{ marginBottom: 28 }}>
            {t('livePreviewDesc')}
          </p>
          <div className="preview-points">
            {[
              { icon: Mic, text: t('previewPoint1') },
              { icon: Volume2, text: t('previewPoint2') },
              { icon: MessageSquare, text: t('previewPoint3') },
              { icon: Sparkles, text: t('previewPoint4') },
            ].map((p) => (
              <div key={p.text} className="preview-point"><span className="pp-icon"><p.icon size={16} /></span><span>{p.text}</span></div>
            ))}
          </div>
          <Link to="/assistant" className="btn btn-primary btn-lg" style={{ marginTop: 32 }}><Mic size={20} />{t('startTalking')}</Link>
        </Reveal>

        <Reveal delay={0.14} className="lp-visual">
          <div className="lp-glow" aria-hidden />
          <div className="lp-card glass">
            <div className="lp-top">
              <div className="lp-dots"><span /><span /><span /></div>
              <div className="lp-status"><span className="status-dot" /> Listening</div>
            </div>
            <div className="lp-orb-area">
              <div className="lp-ring" /><div className="lp-ring r2" />
              <div className="lp-visual-core"><AudioLines size={34} /><span>SWAR AI</span></div>
            </div>
            <div className="lp-wave" aria-hidden>
              {Array.from({ length: 28 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.05}s`, height: `${15 + Math.abs(Math.sin(i * 0.45)) * 85}%` }} />)}
            </div>
            <div className="lp-chat">
              <div className="lp-msg user">What is the weather in Hyderabad?</div>
              <div className="lp-msg ai">
                <div className="lp-msg-label">SWAR AI</div>
                I can check live weather when the weather API is configured. You can also ask me to explain, translate, or tutor in Telugu, Hindi, or English.
              </div>
            </div>
            <div className="lp-chips"><span>Explain simply</span><span>Translate</span><span>Tutor mode</span></div>
          </div>
        </Reveal>
      </div>
      <style>{`
        .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .preview-points { display: flex; flex-direction: column; gap: 14px; }
        .preview-point { display: flex; gap: 12px; align-items: flex-start; color: #ddd; line-height: 1.6; }
        .pp-icon { width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; display: grid; place-items: center; color: var(--accent); background: rgba(255,107,53,0.1); }
        .lp-visual { position: relative; }
        .lp-glow { position: absolute; inset: -8%; background: radial-gradient(circle at 50% 40%, rgba(255,107,53,0.22), transparent 65%); filter: blur(30px); pointer-events: none; }
        .lp-card { position: relative; padding: 24px; border-radius: 28px; background: linear-gradient(180deg, rgba(20,20,20,0.88), rgba(12,12,12,0.78)); overflow: hidden; }
        .lp-card::before { content: ''; position: absolute; inset: -1px; border-radius: 29px; padding: 1px; background: linear-gradient(160deg, rgba(255,107,53,0.4), transparent 35%, transparent 70%, rgba(255,154,90,0.15)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .lp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .lp-dots { display: flex; gap: 6px; } .lp-dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.18); } .lp-dots span:first-child { background: rgba(255,107,53,0.7); }
        .lp-status { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #ddd; }
        .lp-orb-area { position: relative; width: 150px; height: 150px; margin: 0 auto 16px; display: grid; place-items: center; }
        .lp-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(255,107,53,0.25); animation: spin 14s linear infinite; }
        .lp-ring.r2 { inset: 16px; border-style: dashed; border-color: rgba(255,255,255,0.08); animation-direction: reverse; animation-duration: 20s; }
        .lp-visual-core { width: 110px; height: 110px; border-radius: 50%; display: grid; place-items: center; gap: 4px; align-content: center; position: relative; z-index: 1; color: #fff; background: radial-gradient(circle at 35% 30%, rgba(255,154,90,0.95), rgba(255,107,53,0.75) 45%, rgba(168,67,32,0.85)); box-shadow: 0 16px 40px rgba(255,107,53,0.35); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; }
        .lp-wave { display: flex; align-items: center; justify-content: center; gap: 3px; height: 44px; margin-bottom: 20px; }
        .lp-wave span { width: 3px; border-radius: 4px; background: linear-gradient(180deg, var(--accent-2), var(--accent)); animation: wave 0.9s ease-in-out infinite alternate; }
        .lp-chat { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .lp-msg { padding: 12px 14px; border-radius: 14px; font-size: 0.88rem; line-height: 1.55; }
        .lp-msg.user { align-self: flex-end; background: rgba(255,107,53,0.14); border: 1px solid rgba(255,107,53,0.2); color: #fff; max-width: 85%; }
        .lp-msg.ai { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #ddd; }
        .lp-msg-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .lp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .lp-chips span { font-size: 0.75rem; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #ccc; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wave { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        @media (max-width: 900px) { .preview-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .lp-ring, .lp-wave span { animation: none !important; } }
      `}</style>
    </section>
  );
}
