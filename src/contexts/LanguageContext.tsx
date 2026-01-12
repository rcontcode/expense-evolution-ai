import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getTranslation } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language and return 'en' or 'es'
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'es';
  // If browser language starts with 'en', use English; otherwise default to Spanish
  return browserLang.toLowerCase().startsWith('en') ? 'en' : 'es';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // First check if user has a saved preference
    const stored = localStorage.getItem('language');
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
    // Otherwise, detect from browser
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => getTranslation(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};