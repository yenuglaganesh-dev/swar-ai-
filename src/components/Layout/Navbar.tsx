import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Mic, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#top');
  const location = useLocation();
  const onHome = location.pathname === '/';

  const navItems = [
    { label: t('navHome'), href: '/', hash: '#top' },
    { label: 'About', href: '/', hash: '#about' },
    { label: t('navFeatures'), href: '/', hash: '#features' },
    { label: t('navHow'), href: '/', hash: '#how' },
    { label: 'Technology', href: '/', hash: '#technology' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!onHome) return;
    if (!('IntersectionObserver' in window)) return;
    const ids = navItems.map((n) => n.hash.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    try {
      const obs = new IntersectionObserver((entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive('#' + visible.target.id);
      }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.3, 0.6] });
      els.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    } catch (e) {
      console.warn('Nav observer failed', e);
    }
  }, [onHome, t]);

  const goHash = (hash: string) => {
    setOpen(false);
    if (location.pathname !== '/') {
      window.location.href = `/${hash}`;
      return;
    }
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(hash);
    } else {
      window.location.hash = hash;
    }
  };

  return (
    <header className={`nav-wrap ${scrolled ? 'scrolled' : ''}`}>
      <nav className="nav container">
        <Link to="/" className="brand" aria-label="SWAR AI home">
          <span className="brand-mark"><Mic size={18} /></span>
          <span className="brand-name">{t('appName')}</span>
        </Link>

        <div className="nav-links desktop">
          {onHome ? navItems.map((item) => (
            <button key={item.hash} className={`nav-link ${active === item.hash ? 'active' : ''}`} onClick={() => goHash(item.hash)}>{item.label}</button>
          )) : (
            <NavLink to="/" className="nav-link">{t('navHome')}</NavLink>
          )}
          <NavLink to="/assistant" className="nav-link">{t('navAssistant')}</NavLink>
        </div>

        <div className="nav-actions desktop">
          <LanguageSelector compact />
          <Link to="/assistant" className="btn btn-primary btn-sm"><Mic size={16} />{t('startTalking')}</Link>
          <Link to={user ? '/profile' : '/auth'} className="btn btn-secondary btn-icon" aria-label={user ? t('navProfile') : t('navSignIn')}>
            <User size={18} />
          </Link>
        </div>

        <button className="mobile-toggle btn btn-secondary btn-icon" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu glass" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="container mobile-menu-inner">
              <LanguageSelector />
              {onHome ? navItems.map((item) => (
                <button key={item.hash} className={`mobile-link ${active === item.hash ? 'active' : ''}`} onClick={() => goHash(item.hash)}>{item.label}</button>
              )) : (
                <Link to="/" className="mobile-link" onClick={() => setOpen(false)}>{t('navHome')}</Link>
              )}
              <Link to="/assistant" className="mobile-link" onClick={() => setOpen(false)}>{t('navAssistant')}</Link>
              <Link to={user ? '/profile' : '/auth'} className="mobile-link" onClick={() => setOpen(false)}>{user ? t('navProfile') : t('navSignIn')}</Link>
              <Link to="/assistant" className="btn btn-primary" onClick={() => setOpen(false)}><Mic size={18} />{t('startTalking')}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-wrap { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 14px 0; transition: padding .3s; }
        .nav-wrap.scrolled { padding: 10px 0; }
        .nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; border-radius: 999px; background: rgba(8,8,8,0.45); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); transition: background .3s, border-color .3s, box-shadow .3s; }
        .nav-wrap.scrolled .nav { background: rgba(8,8,8,0.72); border-color: rgba(255,255,255,0.1); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em; }
        .brand-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #111; box-shadow: 0 8px 24px rgba(255,107,53,0.4); }
        .nav-links { display: flex; align-items: center; gap: 2px; }
        .nav-link { padding: 10px 14px; color: var(--text-muted); font-weight: 500; font-size: 0.92rem; border-radius: 10px; transition: .2s; position: relative; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #fff; }
        .nav-link.active::after { content: ''; position: absolute; left: 14px; right: 14px; bottom: 5px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .mobile-toggle { display: none; }
        .mobile-menu { position: absolute; top: calc(100% + 4px); left: 16px; right: 16px; border-radius: 20px; }
        .mobile-menu-inner { display: flex; flex-direction: column; gap: 8px; padding: 20px 0; width: calc(100% - 40px); }
        .mobile-link { padding: 14px 8px; font-size: 1.05rem; color: #ddd; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mobile-link.active { color: var(--accent); }
        @media (max-width: 980px) { .desktop { display: none !important; } .mobile-toggle { display: inline-flex; } }
      `}</style>
    </header>
  );
}
