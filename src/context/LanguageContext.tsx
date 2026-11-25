import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { LanguageCode } from '@/types';
import { getTranslation, TranslationKey } from '@/i18n/translations';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getProfile, upsertProfile } from '@/services/dataStore';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const language = settings.preferredLanguage;
  const syncedUserRef = useRef<string | null>(null);
  const lastPushedRef = useRef<string>('');

  const setLanguage = useCallback((lang: LanguageCode) => {
    updateSettings({ preferredLanguage: lang });
  }, [updateSettings]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Restore authenticated user's preferred language from Supabase profile
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) { syncedUserRef.current = null; return; }
    if (syncedUserRef.current === uid) return;
    syncedUserRef.current = uid;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile(uid) as any;
        const remote = profile?.preferred_language;
        if (!cancelled && ['en-IN', 'te-IN', 'hi-IN'].includes(remote) && remote !== language) {
          updateSettings({ preferredLanguage: remote as LanguageCode });
        }
      } catch (e) {
        console.warn('Failed to load language preference:', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Persist language preference to Supabase for authenticated users
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    const key = `${uid}:${language}`;
    if (lastPushedRef.current === key) return;
    lastPushedRef.current = key;
    void upsertProfile(uid, { preferred_language: language }).catch((e) => console.warn('Failed to save language preference:', e));
  }, [user?.uid, language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = getTranslation(language) as Record<string, string>;
    const en = getTranslation('en-IN') as Record<string, string>;
    return {
      language,
      setLanguage,
      t: (key) => dict[key] ?? en[key] ?? key,
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
