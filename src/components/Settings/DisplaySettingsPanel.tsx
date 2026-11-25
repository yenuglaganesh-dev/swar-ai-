import { Minus, Plus, RotateCcw, Monitor, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DISPLAY_SCALES } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  compact?: boolean;
  showChatControls?: boolean;
}

export default function DisplaySettingsPanel({ compact = false, showChatControls = true }: Props) {
  const { settings, updateSettings } = useSettings();
  const { t } = useLanguage();
  const currentIndex = DISPLAY_SCALES.indexOf(settings.displayScale);
  const pct = Math.round(settings.displayScale * 100);

  const setScaleByIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(DISPLAY_SCALES.length - 1, idx));
    updateSettings({ displayScale: DISPLAY_SCALES[clamped] });
  };

  const resetAll = () => {
    updateSettings({
      displayScale: 1,
      chatPanelWidth: 560,
      chatPanelHeight: 720,
      chatPanelMode: 'comfortable',
      chatFullscreen: false,
    });
  };

  return (
    <section className={`display-settings ${compact ? 'compact' : ''}`} aria-label={t('displaySettings')}>
      <div className="display-settings-head">
        <div className="display-title"><Monitor size={18} /> {t('displaySettings')}</div>
        <button className="btn btn-ghost btn-sm" onClick={resetAll} aria-label={t('resetDisplaySettings')}>
          <RotateCcw size={14} /> {t('reset')}
        </button>
      </div>

      <div className="setting-block">
        <div className="setting-row-top">
          <div>
            <div className="setting-label">{t('websiteDisplaySize')}</div>
            <div className="setting-desc">{t('websiteDisplaySizeDesc')}</div>
          </div>
          <div className="zoom-pct" aria-live="polite">{pct}%</div>
        </div>
        <div className="zoom-controls" role="group" aria-label={t('websiteDisplaySize')}>
          <button className="btn btn-secondary btn-icon" onClick={() => setScaleByIndex(currentIndex - 1)} disabled={currentIndex <= 0} aria-label={t('zoomOut')}><Minus size={18} /></button>
          <input
            className="zoom-range"
            type="range"
            min={0}
            max={DISPLAY_SCALES.length - 1}
            step={1}
            value={currentIndex}
            onChange={(e) => setScaleByIndex(Number(e.target.value))}
            aria-label={t('websiteDisplaySize')}
          />
          <button className="btn btn-secondary btn-icon" onClick={() => setScaleByIndex(currentIndex + 1)} disabled={currentIndex >= DISPLAY_SCALES.length - 1} aria-label={t('zoomIn')}><Plus size={18} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => updateSettings({ displayScale: 1 })} aria-label={t('resetToDefault')}>{t('resetToDefault')}</button>
        </div>
        <div className="zoom-presets">
          {DISPLAY_SCALES.map((s) => {
            const p = Math.round(s * 100);
            return <button key={s} className={`chip ${s === settings.displayScale ? 'active-chip' : ''}`} onClick={() => updateSettings({ displayScale: s })} aria-pressed={s === settings.displayScale}>{p}%</button>;
          })}
        </div>
      </div>

      {showChatControls && (
        <div className="setting-block">
          <div className="setting-label">{t('chatPanelSize')}</div>
          <div className="setting-desc">{t('chatPanelSizeDesc')}</div>
          <div className="chat-size-controls">
            <label className="size-field">
              <span>{t('width')}</span>
              <input type="range" min={320} max={1200} step={20} value={settings.chatPanelWidth} onChange={(e) => updateSettings({ chatPanelWidth: Number(e.target.value) })} aria-label={t('chatWidth')} />
              <span className="size-val">{settings.chatPanelWidth}px</span>
            </label>
            <label className="size-field">
              <span>{t('height')}</span>
              <input type="range" min={420} max={1200} step={20} value={settings.chatPanelHeight} onChange={(e) => updateSettings({ chatPanelHeight: Number(e.target.value) })} aria-label={t('chatHeight')} />
              <span className="size-val">{settings.chatPanelHeight}px</span>
            </label>
          </div>
          <div className="zoom-presets">
            <button className={`chip ${settings.chatPanelMode === 'compact' ? 'active-chip' : ''}`} onClick={() => updateSettings({ chatPanelMode: 'compact' })} aria-pressed={settings.chatPanelMode === 'compact'}><PanelLeftClose size={14} /> {t('compactMode')}</button>
            <button className={`chip ${settings.chatPanelMode === 'comfortable' ? 'active-chip' : ''}`} onClick={() => updateSettings({ chatPanelMode: 'comfortable' })} aria-pressed={settings.chatPanelMode === 'comfortable'}><PanelLeftOpen size={14} /> {t('comfortableMode')}</button>
            <button className="chip" onClick={() => updateSettings({ chatFullscreen: !settings.chatFullscreen })} aria-pressed={settings.chatFullscreen}>
              {settings.chatFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {settings.chatFullscreen ? t('restoreChat') : t('fullscreenChat')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .display-settings { display:flex; flex-direction:column; gap:16px; }
        .display-settings-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .display-title { display:flex; align-items:center; gap:8px; font-weight:700; font-size:1rem; }
        .setting-block { padding:14px 0; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:12px; }
        .setting-row-top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .setting-label { font-weight:600; }
        .setting-desc { font-size:.88rem; color:var(--text-muted); margin-top:2px; }
        .zoom-pct { font-weight:800; color:var(--accent-2); min-width:56px; text-align:right; }
        .zoom-controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .zoom-range { flex:1; min-width:140px; accent-color:var(--accent); }
        .zoom-presets { display:flex; flex-wrap:wrap; gap:8px; }
        .active-chip { background:rgba(255,107,53,0.18)!important; border-color:rgba(255,107,53,0.5)!important; color:#fff!important; }
        .chat-size-controls { display:flex; flex-direction:column; gap:10px; }
        .size-field { display:grid; grid-template-columns:64px 1fr 64px; gap:10px; align-items:center; font-size:.9rem; color:#ddd; }
        .size-field input[type=range] { width:100%; accent-color:var(--accent); }
        .size-val { color:var(--text-muted); font-size:.85rem; text-align:right; }
        .display-settings.compact .setting-block { padding:10px 0; }
        @media (max-width:640px){ .size-field { grid-template-columns:1fr; } .size-val { text-align:left; } }
      `}</style>
    </section>
  );
}
