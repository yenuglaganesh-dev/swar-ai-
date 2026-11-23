import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, UserSettings } from '@/types';
import { safeStorage, safeJsonParse } from '@/services/safeStorage';

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const STORAGE_KEY = 'swar_settings';

function normalizeSettings(parsed: any): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(parsed && typeof parsed === 'object' ? parsed : {}),
    preferredLanguage: ['te-IN', 'hi-IN', 'en-IN'].includes(parsed?.preferredLanguage)
      ? parsed.preferredLanguage
      : DEFAULT_SETTINGS.preferredLanguage,
    speechRate: typeof parsed?.speechRate === 'number' ? Math.min(1.5, Math.max(0.7, parsed.speechRate)) : DEFAULT_SETTINGS.speechRate,
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
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.easy = settings.easyMode ? 'true' : 'false';
  }, [settings.easyMode]);

  const value = useMemo(() => ({ settings, updateSettings }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
