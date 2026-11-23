import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { LanguageCode } from '@/types';
import { getTranslation, TranslationKey } from '@/i18n/translations';
import { useSettings } from './SettingsContext';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const language = settings.preferredLanguage;

  const setLanguage = (lang: LanguageCode) => {
    updateSettings({ preferredLanguage: lang });
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = getTranslation(language);
    return {
      language,
      setLanguage,
      t: (key) => dict[key] ?? getTranslation('en-IN')[key] ?? key,
    };
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
