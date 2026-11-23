import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageShell from '@/components/Layout/PageShell';
import SwarAICircle from '@/components/Mascot/SwarAICircle';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/services/supabase';
import { supabaseSignInWithEmail, supabaseSignUpWithEmail, supabaseSignInWithGoogle, supabaseResetPassword } from '@/services/supabaseAuth';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const { t } = useLanguage();
  const { configured } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<'idle' | 'thinking' | 'success' | 'error' | 'password' | 'email'>('idle');
  const [focusField, setFocusField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const notConfigured = !configured || !isSupabaseConfigured();
  const activeMood = loading ? 'thinking' : error ? 'error' : mood === 'success' ? 'success' : focusField === 'password' ? 'password' : focusField === 'email' ? 'email' : 'idle';
  void activeMood;

  const resetFeedback = () => { setError(null); setInfo(null); if (mood === 'error' || mood === 'success') setMood('idle'); };

  const wrap = async (fn: () => Promise<void>, fallback: string) => {
    setLoading(true); setError(null); setInfo(null); setMood('thinking');
    try {
      await fn();
    } catch (e: any) {
      const msg = String(e?.message || e || fallback);
      const nice = /provider is not enabled|Unsupported provider/i.test(msg) ? t('googleNotConfigured') : msg;
      setError(nice);
      setMood('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => wrap(async () => {
    const { error } = await supabaseSignInWithGoogle();
    if (error) throw error;
  }, t('googleError'));

  const handleEmail = () => wrap(async () => {
    if (mode === 'signup') {
      const { data, error } = await supabaseSignUpWithEmail(email, password, name);
      if (error) throw error;
      if (!data.session) { setInfo(t('emailVerificationSent')); setMood('success'); return; }
    } else {
      const { error } = await supabaseSignInWithEmail(email, password);
      if (error) throw error;
    }
    setMood('success'); setInfo(t('loginSuccess'));
    window.setTimeout(() => navigate('/assistant'), 700);
  }, t('emailError'));

  const handleReset = () => wrap(async () => {
    const { error } = await supabaseResetPassword(email);
    if (error) throw error;
    setInfo(t('passwordResetSent')); setMood('success');
  }, t('emailError'));

  const title = mode === 'signup' ? t('createAccount') : mode === 'reset' ? t('forgotPassword') : t('welcomeBack');

  return (
    <PageShell>
      <div className="auth-page">
        <div className="auth-bg" aria-hidden>
          <div className="auth-gradient" />
          <div className="auth-orb orb-a" />
          <div className="auth-orb orb-b" />
          <div className="auth-grid" />
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="particles">
            {Array.from({ length: 18 }).map((_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 100}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${6 + (i % 5)}s` }} />)}
          </div>
        </div>

        <motion.div className="auth-shell" initial={reduce ? false : { opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="auth-card glass">
            <section className="auth-visual">
              <div className="visual-top">
                <div className="brand-mini"><span className="brand-dot" /> {t('appName')}</div>
                <div className="visual-pill"><Sparkles size={14} /> AI Voice Assistant</div>
              </div>
              <div className="visual-mascot"><SwarAICircle size={220} /></div>
              <div className="visual-copy">
                <h2>{t('loginHeroTitle')}</h2>
                <p>{t('loginHeroSubtitle')}</p>
              </div>
              <div className="visual-wave" aria-hidden>{Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ height: `${20 + Math.abs(Math.sin(i * 0.55)) * 80}%`, animationDelay: `${i * 0.06}s` }} />)}</div>
            </section>

            <section className="auth-form-side">
              <div className="form-head">
                <div className="form-brand">{t('appName')}</div>
                <h1>{title}</h1>
                <p>{mode === 'reset' ? t('passwordResetSent').replace('sent. Please check your inbox.', 'instructions by email.') : t('signInSubtitle')}</p>
              </div>

              {notConfigured && <div className="auth-notice warn"><AlertCircle size={18} /><span>{t('supabaseNotConfigured')}</span></div>}
              <AnimatePresence>{error && <motion.div className="auth-notice error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><AlertCircle size={18} /><span>{error}</span></motion.div>}</AnimatePresence>
              <AnimatePresence>{info && <motion.div className="auth-notice ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><CheckCircle2 size={18} /><span>{info}</span></motion.div>}</AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div key={mode} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }} transition={{ duration: 0.28 }}>
                  {(mode === 'signin' || mode === 'signup') && (
                    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleEmail(); }}>
                      {mode === 'signup' && (
                        <label className="field"><span className="field-label">{t('name')}</span><div className="input-wrap"><input className="input" value={name} onChange={(e) => { setName(e.target.value); resetFeedback(); }} autoComplete="name" placeholder="Your name" /></div></label>
                      )}
                      <label className="field"><span className="field-label">{t('email')}</span><div className="input-wrap"><Mail size={18} className="input-icon" /><input className="input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); resetFeedback(); }} onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)} autoComplete="email" required placeholder="you@example.com" /></div></label>
                      <label className="field"><span className="field-label">{t('password')}</span><div className="input-wrap"><Lock size={18} className="input-icon" /><input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); resetFeedback(); }} onFocus={() => { setFocusField('password'); setMood('password'); }} onBlur={() => setFocusField(null)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required placeholder="••••••••" /><button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? t('hidePassword') : t('showPassword')}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
                      {mode === 'signin' && <div className="form-row"><button type="button" className="link-btn" onClick={() => { setMode('reset'); resetFeedback(); }}>{t('forgotPassword')}</button></div>}
                      <button className="btn btn-primary submit-btn" type="submit" disabled={loading || notConfigured || !email || !password}>{loading ? <span className="btn-loading"><span className="spinner" />{mode === 'signup' ? t('creatingAccount') : t('signingIn')}</span> : <span className="btn-loading">{mode === 'signup' ? t('createAccount') : t('signIn')} <ArrowRight size={18} /></span>}</button>
                      <div className="divider"><span>{t('or')}</span></div>
                      <button type="button" className="btn btn-secondary google-btn" onClick={handleGoogle} disabled={loading || notConfigured}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> {t('continueWithGoogle')}</button>
                      <p className="switch-copy">{mode === 'signup' ? t('haveAccount') : t('noAccount')} <button type="button" className="link-btn inline" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); resetFeedback(); }}>{mode === 'signup' ? t('signIn') : t('createAccount')}</button></p>
                    </form>
                  )}
                  {mode === 'reset' && (
                    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleReset(); }}>
                      <label className="field"><span className="field-label">{t('email')}</span><div className="input-wrap"><Mail size={18} className="input-icon" /><input className="input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); resetFeedback(); }} required placeholder="you@example.com" /></div></label>
                      <button className="btn btn-primary submit-btn" type="submit" disabled={loading || notConfigured || !email}>{loading ? <span className="btn-loading"><span className="spinner" />{t('loading')}</span> : t('forgotPassword')}</button>
                      <button type="button" className="link-btn" onClick={() => { setMode('signin'); resetFeedback(); }}>{t('back')}</button>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 32px 20px; position: relative; overflow: hidden; }
        .auth-bg { position: absolute; inset: 0; pointer-events: none; }
        .auth-gradient { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 55% at 30% 20%, rgba(255,107,53,0.2), transparent 55%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255,154,90,0.12), transparent 60%), linear-gradient(180deg, #120d0a 0%, #080808 45%, #060606 100%); }
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; animation: floatOrb 12s ease-in-out infinite; }
        .orb-a { width: 420px; height: 420px; left: -80px; top: -80px; background: rgba(255,107,53,0.2); }
        .orb-b { width: 360px; height: 360px; right: -60px; bottom: -60px; background: rgba(255,154,90,0.14); animation-delay: -5s; }
        .auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent); }
        .cloud { position: absolute; background: radial-gradient(ellipse at center, rgba(255,255,255,0.08), transparent 70%); border-radius: 50%; filter: blur(2px); animation: cloudDrift 28s linear infinite; }
        .cloud-1 { width: 420px; height: 120px; top: 12%; left: -10%; }
        .cloud-2 { width: 340px; height: 100px; top: 22%; left: 55%; animation-duration: 36s; animation-delay: -8s; opacity: .7; }
        .cloud-3 { width: 300px; height: 90px; bottom: 15%; left: 15%; animation-duration: 32s; animation-delay: -16s; opacity: .5; }
        .particles span { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: rgba(255,154,90,0.7); box-shadow: 0 0 12px rgba(255,107,53,0.6); animation: particleFloat linear infinite; }
        .auth-shell { width: min(1080px, 100%); position: relative; z-index: 1; }
        .auth-card { display: grid; grid-template-columns: 1.05fr .95fr; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(145deg, rgba(20,20,20,0.72), rgba(10,10,10,0.78)); box-shadow: 0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06); backdrop-filter: blur(24px); }
        .auth-visual { padding: 40px; position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 640px; background: linear-gradient(180deg, rgba(255,107,53,0.12), rgba(255,255,255,0.01) 35%, rgba(0,0,0,0.15)); border-right: 1px solid rgba(255,255,255,0.06); }
        .auth-visual::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,154,90,0.18), transparent 65%); pointer-events: none; }
        .visual-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; position: relative; }
        .brand-mini { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em; }
        .brand-dot { width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(135deg, #ff9a5a, #ff6b35); box-shadow: 0 0 0 4px rgba(255,107,53,0.16); }
        .visual-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; font-size: .75rem; color: #ffd7c5; background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.2); }
        .visual-mascot { display:grid; place-items:center; padding: 20px 0; position: relative; }
        .visual-copy { position: relative; }
        .visual-copy h2 { margin: 0 0 12px; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.15; letter-spacing: -0.03em; max-width: 11ch; }
        .visual-copy p { margin: 0; color: var(--text-muted); font-size: 1.05rem; line-height: 1.7; }
        .visual-wave { display: flex; align-items: flex-end; gap: 4px; height: 48px; opacity: .9; }
        .visual-wave span { flex: 1; min-width: 3px; background: linear-gradient(180deg, #ffb067, rgba(255,107,53,0.25)); border-radius: 99px; animation: waveBar 1.3s ease-in-out infinite alternate; transform-origin: bottom; }
        .auth-form-side { padding: 48px; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent); }
        .form-head { margin-bottom: 28px; }
        .form-brand { color: var(--accent); font-weight: 700; font-size: .85rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 12px; }
        .form-head h1 { margin: 0 0 10px; font-size: clamp(2rem, 3vw, 2.8rem); line-height: 1.1; letter-spacing: -0.03em; }
        .form-head p { margin: 0; color: var(--text-muted); line-height: 1.6; }
        .auth-form { display: flex; flex-direction: column; gap: 18px; }
        .input-wrap { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }
        .auth-form .input { height: 52px; padding-left: 44px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; transition: border-color .25s, box-shadow .25s, background .25s, transform .25s; }
        .auth-form .input:focus { background: rgba(255,107,53,0.04); border-color: rgba(255,107,53,0.7); box-shadow: 0 0 0 4px rgba(255,107,53,0.12), 0 10px 30px rgba(255,107,53,0.08); transform: translateY(-1px); }
        .eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #999; }
        .eye-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .form-row { display: flex; justify-content: flex-end; margin-top: -6px; }
        .submit-btn, .google-btn { width: 100%; height: 52px; border-radius: 14px; font-weight: 600; }
        .submit-btn { box-shadow: 0 16px 40px rgba(255,107,53,0.28); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 48px rgba(255,107,53,0.35); }
        .submit-btn:active:not(:disabled), .google-btn:active:not(:disabled) { transform: translateY(1px) scale(0.995); }
        .btn-loading { display: inline-flex; align-items: center; gap: 10px; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.15); border-top-color: #111; border-radius: 50%; animation: spin .8s linear infinite; }
        .google-btn { background: rgba(255,255,255,0.03); }
        .divider { display: flex; align-items: center; gap: 12px; color: #888; font-size: .85rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .switch-copy { margin: 0; text-align: center; color: var(--text-muted); font-size: .95rem; }
        .link-btn { color: #ff9a5a; font-size: .92rem; padding: 0; background: none; border: none; cursor: pointer; }
        .link-btn:hover { color: #ffb067; text-decoration: underline; }
        .link-btn.inline { font-weight: 600; }
        .auth-notice { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; font-size: .92rem; line-height: 1.5; margin-bottom: 16px; }
        .auth-notice.warn { background: rgba(255,154,90,0.1); color: #ffd2c2; border: 1px solid rgba(255,154,90,0.2); }
        .auth-notice.error { background: rgba(255,77,77,0.1); color: #ffb3b3; border: 1px solid rgba(255,77,77,0.2); }
        .auth-notice.ok { background: rgba(72,187,120,0.1); color: #b7f0cd; border: 1px solid rgba(72,187,120,0.2); }
        @keyframes floatOrb { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-20px); } }
        @keyframes cloudDrift { from { transform: translateX(0); } to { transform: translateX(130vw); } }
        @keyframes particleFloat { 0%,100% { transform: translateY(0); opacity: .2; } 50% { transform: translateY(-18px); opacity: .8; } }
        @keyframes waveBar { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 980px) { .auth-card { grid-template-columns: 1fr; } .auth-visual { min-height: auto; border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 32px 28px; } .visual-copy h2 { max-width: 18ch; } .auth-form-side { padding: 36px 28px 40px; } }
        @media (max-width: 560px) { .auth-page { padding: 16px; } .auth-card { border-radius: 24px; } .auth-visual, .auth-form-side { padding: 24px 20px; } .visual-top { flex-direction: column; align-items: flex-start; } .form-head h1 { font-size: 2rem; } .visual-copy h2 { max-width: 100%; font-size: 1.8rem; } .submit-btn, .google-btn, .auth-form .input { height: 50px; } }
        @media (prefers-reduced-motion: reduce) { .auth-orb, .cloud, .particles span, .visual-wave span, .spinner { animation: none !important; } }
      `}</style>
    </PageShell>
  );
}
