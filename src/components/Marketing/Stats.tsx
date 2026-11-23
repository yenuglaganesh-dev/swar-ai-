import { useReducedMotion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import Reveal from './Reveal';

export default function Stats() {
  const reduce = useReducedMotion();
  const stats = [
    { value: 3, suffix: '', label: 'Languages supported', note: 'Telugu, Hindi, English' },
    { value: 8, suffix: '+', label: 'Core AI capabilities', note: 'Voice, tutor, translation, memory & more' },
    { value: 100, suffix: '%', label: 'Voice-first focus', note: 'Designed for natural conversation' },
  ];

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Real capabilities</span>
          <h2 className="section-title"><span className="gradient-text">Built to be useful, not just impressive</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>These numbers reflect actual SWAR AI capabilities included in this product.</p>
        </Reveal>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="stat-card glass">
              <div className="stat-value"><AnimatedCounter to={s.value} suffix={s.suffix} /></div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-note">{s.note}</div>
              <div className="stat-bar"><span style={{ width: reduce ? '100%' : undefined }} className={`stat-fill stat-fill-${i}`} /></div>
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`
        .center { text-align: center; } .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stat-card { padding: 32px; border-radius: 24px; text-align: center; }
        .stat-value { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; background: linear-gradient(135deg, #fff, var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; margin-bottom: 12px; }
        .stat-label { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; }
        .stat-note { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px; }
        .stat-bar { height: 3px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
        .stat-fill { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); border-radius: 999px; animation: fillBar 1.6s cubic-bezier(.22,1,.36,1) forwards; transform-origin: left; }
        .stat-fill-0 { --w: 100%; width: 0; animation-name: fill0; } .stat-fill-1 { --w: 100%; width: 0; animation-name: fill1; } .stat-fill-2 { --w: 100%; width: 0; animation-name: fill2; }
        @keyframes fill0 { to { width: 100%; } } @keyframes fill1 { to { width: 100%; } } @keyframes fill2 { to { width: 100%; } }
        @media (max-width: 760px) { .stats-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .stat-fill { animation: none !important; width: 100% !important; } }
      `}</style>
    </section>
  );
}
