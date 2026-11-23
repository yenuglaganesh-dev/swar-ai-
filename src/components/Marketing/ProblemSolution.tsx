import { XCircle, CheckCircle2 } from 'lucide-react';
import Reveal from './Reveal';

export default function ProblemSolution() {
  const problems = ['Typing barriers for many users', 'Language gaps in digital tools', 'Complex interfaces and small controls', 'Information that is hard to access by voice'];
  const solutions = ['Natural voice conversations', 'Telugu, Hindi, and English support', 'Large, accessible, easy-mode controls', 'AI answers, translation, tutor, and document help'];
  return (
    <section className="section ps-section" id="problem-solution">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Why SWAR AI</span>
          <h2 className="section-title"><span className="gradient-text">From barriers to conversation</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Technology should listen. SWAR AI turns everyday questions into simple voice interactions.</p>
        </Reveal>
        <div className="ps-grid">
          <Reveal className="ps-card glass ps-problem">
            <h3><XCircle size={20} className="ps-bad" /> The problem</h3>
            <ul>{problems.map((p) => <li key={p}><span className="ps-dot bad" />{p}</li>)}</ul>
          </Reveal>
          <Reveal delay={0.12} className="ps-card glass ps-solution">
            <div className="ps-glow" aria-hidden />
            <h3><CheckCircle2 size={20} className="ps-good" /> The SWAR AI solution</h3>
            <ul>{solutions.map((s) => <li key={s}><span className="ps-dot good" />{s}</li>)}</ul>
          </Reveal>
        </div>
      </div>
      <style>{`
        .ps-section { background: linear-gradient(180deg, rgba(255,107,53,0.03), transparent 30%, transparent 70%, rgba(255,107,53,0.03)); }
        .center { text-align: center; } .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        .ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ps-card { padding: 32px; border-radius: 24px; position: relative; overflow: hidden; }
        .ps-card h3 { display: flex; align-items: center; gap: 10px; margin: 0 0 24px; font-size: 1.35rem; }
        .ps-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
        .ps-card li { display: flex; align-items: flex-start; gap: 12px; color: #ddd; line-height: 1.6; }
        .ps-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 8px; flex-shrink: 0; }
        .ps-dot.bad { background: rgba(255,255,255,0.25); } .ps-dot.good { background: var(--accent); box-shadow: 0 0 0 4px rgba(255,107,53,0.15); }
        .ps-bad { color: #ff8a8a; } .ps-good { color: var(--accent); }
        .ps-solution { border-color: rgba(255,107,53,0.2); }
        .ps-glow { position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,107,53,0.15), transparent 70%); pointer-events: none; }
        @media (max-width: 760px) { .ps-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
