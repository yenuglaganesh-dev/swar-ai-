import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, DISPLAY_SCALES, DisplayScale, ChatPanelMode, UserSettings } from '@/types';
import { safeStorage, safeJsonParse } from '@/services/safeStorage';

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const STORAGE_KEY = 'swar_settings';

function normalizeSettings(parsed: any): UserSettings {
  const scale = Number(parsed?.displayScale);
  const displayScale = (DISPLAY_SCALES as number[]).includes(scale) ? (scale as DisplayScale) : DEFAULT_SETTINGS.displayScale;
  const chatPanelMode: ChatPanelMode = parsed?.chatPanelMode === 'compact' ? 'compact' : 'comfortable';
  const width = Number(parsed?.chatPanelWidth);
  const height = Number(parsed?.chatPanelHeight);
  return {
    ...DEFAULT_SETTINGS,
    ...(parsed && typeof parsed === 'object' ? parsed : {}),
    preferredLanguage: ['te-IN', 'hi-IN', 'en-IN'].includes(parsed?.preferredLanguage)
      ? parsed.preferredLanguage
      : DEFAULT_SETTINGS.preferredLanguage,
    speechRate: typeof parsed?.speechRate === 'number' ? Math.min(1.5, Math.max(0.7, parsed.speechRate)) : DEFAULT_SETTINGS.speechRate,
    displayScale,
    chatPanelMode,
    chatPanelWidth: Number.isFinite(width) ? Math.min(1200, Math.max(320, width)) : DEFAULT_SETTINGS.chatPanelWidth,
    chatPanelHeight: Number.isFinite(height) ? Math.min(1200, Math.max(420, height)) : DEFAULT_SETTINGS.chatPanelHeight,
    chatFullscreen: Boolean(parsed?.chatFullscreen),
  };
}

function loadSettings(): UserSettings {
  const parsed = safeJsonParse<any>(safeStorage.getItem(STORAGE_KEY), null);
  return normalizeSettings(parsed);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  const updateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(loadSettings());
    };
    try {
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = 'dark';
    root.dataset.easy = settings.easyMode ? 'true' : 'false';
    root.style.setProperty('--app-scale', String(settings.displayScale));
    root.style.setProperty('--app-inv-scale', String(1 / settings.displayScale));
  }, [settings.easyMode, settings.displayScale]);

  const value = useMemo(() => ({ settings, updateSettings }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
