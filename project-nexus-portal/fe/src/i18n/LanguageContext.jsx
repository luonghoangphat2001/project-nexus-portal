import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from './translations/en';
import { vi } from './translations/vi';

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
];

const dictionaries = {
  vi,
  en,
};

const LanguageContext = createContext(null);

const STORAGE_KEY = 'nexus_lang';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'vi' || saved === 'en')) {
      return saved;
    }
    // Default to Vietnamese ('vi') as default system language
    return 'vi';
  });

  const setLanguage = useCallback((lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Helper function to translate keys using dot notation (e.g. 'nav.dashboard')
   * Supports parameters: t('dashboard.increasedBy', { value: '10%' })
   */
  const t = useCallback((keyPath, params = {}) => {
    if (!keyPath) return '';

    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);
    };

    // 1. Look in current language
    let text = getNestedValue(dictionaries[language], keyPath);

    // 2. Fallback to English if missing in current language
    if (text === undefined && language !== 'en') {
      text = getNestedValue(dictionaries['en'], keyPath);
    }

    // 3. Fallback to keyPath itself if not found
    if (text === undefined) {
      return keyPath;
    }

    // 4. Interpolate variables: {key} or {{key}}
    if (params && typeof params === 'object') {
      Object.keys(params).forEach((paramKey) => {
        const val = params[paramKey];
        text = text.replace(new RegExp(`\\{\\{?\\s*${paramKey}\\s*\\}\\}?`, 'g'), String(val));
      });
    }

    return text;
  }, [language]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageInfo: SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Alias for developers familiar with i18next convention
export const useTranslation = useLanguage;

export default LanguageContext;
