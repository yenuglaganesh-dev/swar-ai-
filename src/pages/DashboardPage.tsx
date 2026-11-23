import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Shield, BarChart3, MessageSquare, Mic, Type, AlertTriangle } from 'lucide-react';
import PageShell from '@/components/Layout/PageShell';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { listConversations, listMemories, getUsageStats, clearMemories, deleteConversation, ConversationRecord, MemoryItem } from '@/services/dataStore';
import { isSupabaseConfigured } from '@/services/supabase';
import { safeStorage } from '@/services/safeStorage';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [convos, setConvos] = useState<ConversationRecord[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number> }>({ total: 0, byType: {} });
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!user) return;
    const [c, m, s] = await Promise.all([listConversations(user.uid), listMemories(user.uid), getUsageStats(user.uid)]);
    setConvos(c); setMemories(m); setStats(s);
  };

  useEffect(() => { load(); }, [user?.uid]); // eslint-disable-line

  if (loading) return <PageShell><div className="container" style={{ paddingTop: 140 }}>{t('loading')}</div></PageShell>;
  if (!user) return <Navigate to="/auth" replace />;

  const deleteLocal = () => {
    safeStorage.removeItem('swar_history');
    safeStorage.removeItem('swar_settings');
    safeStorage.removeItem('swar_usage_local');
    safeStorage.removeItem(`swar_memories_${user.uid}`);
    setMsg(t('dataDeleted'));
    load();
  };

  return (
    <PageShell>
      <div className="profile-page"><div className="container profile-container">
        <Link to="/assistant" className="back-link"><ArrowLeft size={18} /> {t('back')}</Link>
        <div className="profile-card glass">
          <h1 style={{ marginTop: 0 }}>{t('dashboard')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboardIntro')}</p>
          {!isSupabaseConfigured() && <div className="notice"><AlertTriangle size={16} />{t('supabaseNotConfigured')}</div>}
          {msg && <div className="notice">{msg}</div>}

          <section className="dash-section">
            <h2><BarChart3 size={18} /> {t('usageStats')}</h2>
            <div className="stats-grid">
              <div className="stat glass"><div className="stat-n">{stats.total}</div><div className="stat-l">{t('totalInteractions')}</div></div>
              <div className="stat glass"><div className="stat-n">{stats.byType.voice_start || 0}</div><div className="stat-l"><Mic size={14} /> {t('voiceInteractions')}</div></div>
              <div className="stat glass"><div className="stat-n">{stats.byType.message_sent || 0}</div><div className="stat-l"><Type size={14} /> {t('textInteractions')}</div></div>
            </div>
          </section>

          <section className="dash-section">
            <h2><MessageSquare size={18} /> {t('recentConversations')}</h2>
            {convos.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{t('noConversations')}</p> : (
              <div className="list">{convos.map((c) => (
                <div key={c.id} className="list-item glass">
                  <div><div style={{ fontWeight: 600 }}>{c.title || 'Conversation'}</div><div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{new Date(c.updated_at).toLocaleString()}</div></div>
                  <button className="btn btn-ghost btn-icon" onClick={async () => { await deleteConversation(user.uid, c.id); load(); }} aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              ))}</div>
            )}
          </section>

          <section className="dash-section">
            <h2><Shield size={18} /> {t('privacySettings')}</h2>
            <div className="setting-row"><div><div className="setting-label">{t('memoryConsent')}</div><div className="setting-desc">{t('memoryConsentDesc')}</div></div><button className={`toggle ${settings.memoryConsent ? 'on' : ''}`} onClick={() => updateSettings({ memoryConsent: !settings.memoryConsent })}><span /></button></div>
            <div className="setting-row"><div><div className="setting-label">{t('saveAudio')}</div><div className="setting-desc">{t('saveAudioDesc')}</div></div><button className={`toggle ${settings.saveAudio ? 'on' : ''}`} onClick={() => updateSettings({ saveAudio: !settings.saveAudio })}><span /></button></div>
            <div className="setting-row"><div><div className="setting-label">{t('saveHistory')}</div></div><button className={`toggle ${settings.saveHistory ? 'on' : ''}`} onClick={() => updateSettings({ saveHistory: !settings.saveHistory })}><span /></button></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={async () => { await clearMemories(user.uid); load(); }}><Trash2 size={16} />{t('clearMemory')}</button>
              <button className="btn btn-secondary" onClick={deleteLocal}><Trash2 size={16} />{t('deleteData')}</button>
            </div>
          </section>

          <section className="dash-section">
            <h2>{t('memories')}</h2>
            {memories.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{t('noMemories')}</p> : <div className="list">{memories.map((m) => <div key={m.id} className="list-item glass"><div style={{ fontSize: '.95rem' }}>{m.content}</div></div>)}</div>}
          </section>
        </div>
      </div></div>
      <style>{`
        .profile-page{min-height:100vh;padding:40px 0 60px}.profile-container{width:min(900px,calc(100% - 32px))}
        .back-link{display:inline-flex;align-items:center;gap:8px;color:var(--text-muted);margin-bottom:20px}
        .profile-card{padding:32px;border-radius:24px}.notice{display:flex;gap:8px;align-items:center;padding:12px 14px;border-radius:12px;background:rgba(255,154,90,0.1);color:#ffd2c2;margin:12px 0}
        .dash-section{margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08)}.dash-section h2{display:flex;align-items:center;gap:8px;font-size:1.15rem;margin:0 0 14px}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stat{padding:18px;border-radius:16px;text-align:center}.stat-n{font-size:1.8rem;font-weight:800;color:var(--accent)}.stat-l{color:var(--text-muted);font-size:.9rem;display:flex;gap:6px;justify-content:center;align-items:center}
        .list{display:flex;flex-direction:column;gap:10px}.list-item{padding:14px 16px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
        .setting-label{font-weight:600}.setting-desc{font-size:.88rem;color:var(--text-muted);margin-top:2px}
        .toggle{width:52px;height:30px;border-radius:999px;background:rgba(255,255,255,0.15);padding:3px;transition:.2s;flex-shrink:0}.toggle span{display:block;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}
        .toggle.on{background:var(--accent)}.toggle.on span{transform:translateX(22px)}
        @media (max-width:720px){.stats-grid{grid-template-columns:1fr}.profile-card{padding:24px}.setting-row{flex-direction:column;align-items:stretch}}
      `}</style>
    </PageShell>
  );
}
