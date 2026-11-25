import Navbar from '@/components/Layout/Navbar';
import PageShell from '@/components/Layout/PageShell';
import Hero from '@/components/Marketing/Hero';
import About from '@/components/Marketing/About';
import ProblemSolution from '@/components/Marketing/ProblemSolution';
import Features from '@/components/Marketing/Features';
import Stats from '@/components/Marketing/Stats';
import HowItWorks from '@/components/Marketing/HowItWorks';
import TechVision from '@/components/Marketing/TechVision';
import LivePreview from '@/components/Marketing/LivePreview';
import Footer from '@/components/Marketing/Footer';
import { useLanguage } from '@/context/LanguageContext';
import Reveal from '@/components/Marketing/Reveal';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomePage() {
  const { t } = useLanguage();
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash;
    const tmr = window.setTimeout(() => {
      const el = document.querySelector(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(tmr);
  }, [location.hash]);
  return (
    <PageShell>
      <Navbar />
      <main>
        <Hero />
        <About />
        <ProblemSolution />
        <Features />
        <Stats />
        <HowItWorks />
        <TechVision />
        <LivePreview />
        <section className="section cta-section" id="cta">
          <div className="container">
            <Reveal className="cta glass">
              <div>
                <span className="eyebrow">{t('getStarted')}</span>
                <h2 className="section-title" style={{ marginBottom: 12 }}><span className="gradient-text">{t('trySwar')}</span></h2>
                <p className="section-subtitle">{t('mission')}</p>
              </div>
              <Link to="/assistant" className="btn btn-primary btn-lg">{t('startTalking')}</Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        .cta-section { padding-top: 40px; }
        .cta { padding: 48px; border-radius: 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px; background: linear-gradient(135deg, rgba(255,107,53,0.14), rgba(255,255,255,0.02)); position: relative; overflow: hidden; }
        .cta::before { content: ''; position: absolute; top: -100px; right: -100px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(255,107,53,0.2), transparent 70%); pointer-events: none; }
        .eyebrow { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
        @media (max-width: 720px) { .cta { flex-direction: column; align-items: stretch; text-align: center; padding: 32px 24px; } .cta .section-subtitle { margin: 0 auto; } }
      `}</style>
    </PageShell>
  );
}
