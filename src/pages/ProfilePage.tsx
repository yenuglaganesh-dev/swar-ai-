import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User, Save, Shield } from 'lucide-react';
import PageShell from '@/components/Layout/PageShell';
import LanguageSelector from '@/components/Layout/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { upsertProfile } from '@/services/dataStore';
import { isSupabaseConfigured } from '@/services/supabase';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { user, loading, signOut } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) return <PageShell><div className="container" style={{ paddingTop: 140, color: '#a0a0a0' }}>{t('loading')}</div></PageShell>;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async () => {
    setSaveError(null);
    try {
      if (isSupabaseConfigured()) {
        await upsertProfile(user.uid, {
          email: user.email,
          phone: user.phoneNumber,
          name: user.name,
          preferred_language: settings.preferredLanguage,
          auto_detect_language: settings.autoDetectLanguage,
          speech_rate: settings.speechRate,
          easy_mode: settings.easyMode,
          memory_consent: settings.memoryConsent,
          save_history: settings.saveHistory,
          save_audio: settings.saveAudio,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save profile settings.');
    }
  };

  return (
    <PageShell>
      <div className="profile-page">
        <div className="container profile-container">
          <Link to="/assistant" className="back-link"><ArrowLeft size={18} /> {t('back')}</Link>
          <div className="profile-card glass">
            <div className="profile-head">
              <div className="profile-avatar"><User size={28} /></div>
              <div>
                <h1>{t('profile')}</h1>
                <p>{user.name}</p>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <span className="label">{t('name')}</span>
                <span className="value">{user.name}</span>
              </div>
              {user.email && <div className="profile-field"><span className="label">{t('email')}</span><span className="value">{user.email}</span></div>}
              {user.phoneNumber && <div className="profile-field"><span className="label">{t('phone')}</span><span className="value">{user.phoneNumber}</span></div>}
            </div>

            <div className="settings-section">
              <h2>{t('settings')}</h2>
              <div className="setting-row">
                <div>
                  <div className="setting-label">{t('preferredLanguage')}</div>
                </div>
                <LanguageSelector compact />
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-label">{t('autoDetectLanguage')}</div>
                </div>
                <button className={`toggle ${settings.autoDetectLanguage ? 'on' : ''}`} onClick={() => updateSettings({ autoDetectLanguage: !settings.autoDetectLanguage })} aria-pressed={settings.autoDetectLanguage}><span /></button>
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-label">{t('speechRate')}</div>
                  <div className="setting-desc">{settings.speechRate.toFixed(1)}x</div>
                </div>
                <input type="range" min="0.7" max="1.3" step="0.1" value={settings.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })} aria-label={t('speechRate')} />
              </div>
              <div className="setting-row">
                <div><div className="setting-label">{t('saveHistory')}</div></div>
                <button className={`toggle ${settings.saveHistory ? 'on' : ''}`} onClick={() => updateSettings({ saveHistory: !settings.saveHistory })} aria-pressed={settings.saveHistory}><span /></button>
              </div>
            </div>

            <div className="privacy-box">
              <Shield size={18} />
              <div>
                <div className="setting-label">{t('privacyTitle')}</div>
                <p>{t('privacyText')}</p>
              </div>
            </div>

            {saveError && <div style={{ color: '#ffb3b3', marginBottom: 12, fontSize: '0.9rem' }}>{saveError}</div>}
            <div className="profile-actions">
              <button className="btn btn-primary" onClick={save}><Save size={16} /> {saved ? t('saved') : t('save')}</button>
              <button className="btn btn-secondary" onClick={() => signOut()}><LogOut size={16} /> {t('navSignOut')}</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .profile-page { min-height: 100vh; padding: 40px 0 60px; }
        .profile-container { width: min(720px, calc(100% - 32px)); }
        .back-link { display: inline-flex; align-items: center; gap: 8px; color: var(--text-muted); margin-bottom: 20px; font-weight: 500; }
        .back-link:hover { color: #fff; }
        .profile-card { padding: 32px; border-radius: 24px; }
        .profile-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        .profile-avatar { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; background: rgba(255,107,53,0.12); color: var(--accent); }
        .profile-head h1 { margin: 0; font-size: 1.8rem; }
        .profile-head p { margin: 4px 0 0; color: var(--text-muted); }
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .profile-field .label { display: block; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .profile-field .value { font-size: 1rem; }
        .settings-section h2 { font-size: 1.2rem; margin: 0 0 16px; }
        .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .setting-label { font-weight: 600; }
        .setting-desc { font-size: 0.88rem; color: var(--text-muted); margin-top: 2px; }
        .toggle { width: 52px; height: 30px; border-radius: 999px; background: rgba(255,255,255,0.15); padding: 3px; transition: .2s; flex-shrink: 0; }
        .toggle span { display: block; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform .2s; }
        .toggle.on { background: var(--accent); }
        .toggle.on span { transform: translateX(22px); }
        .setting-row input[type=range] { width: 160px; accent-color: var(--accent); }
        .privacy-box { display: flex; gap: 14px; padding: 16px; margin: 24px 0; border-radius: 14px; background: rgba(255,255,255,0.03); color: #ddd; }
        .privacy-box svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
        .privacy-box p { margin: 6px 0 0; color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; }
        .profile-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 560px) { .profile-card { padding: 24px; } .setting-row { flex-direction: column; align-items: stretch; } .setting-row input[type=range] { width: 100%; } }
      `}</style>
    </PageShell>
  );
}
