import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LocaleContext = createContext(null);
const STORAGE_KEY = 'solveit-public-locale';

function initialLocale() {
  try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar'; }
  catch { return 'ar'; }
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* Private browsing can block storage. */ }
  }, [locale]);
  const value = useMemo(() => ({
    locale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    setLocale,
    tr: (arabic, english) => locale === 'ar' ? arabic : english,
  }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
