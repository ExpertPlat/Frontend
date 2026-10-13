import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserI18nProvider, getUserDirection } from '../i18n/UserI18nContext';
import { UserSessionProvider } from '../session/UserSessionContext';
import UserSidebar from './UserSidebar';
import UserTopbar from './UserTopbar';
import '../styles/index.css';

const readPreference = (key, fallback) => {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writePreference = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage can be blocked (private mode) */ }
};

/** Persistent layout for every /app/* page: sidebar + topbar stay mounted while pages change. */
export default function UserShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => readPreference('ecp-user-theme', 'light'));
  const [timezone, setTimezone] = useState(undefined);
  const [language, setLanguage] = useState(() => (readPreference('ecp-user-language', 'ar') === 'en' ? 'en' : 'ar'));
  const direction = getUserDirection(language);
  const { pathname } = useLocation();

  useEffect(() => { writePreference('ecp-user-theme', theme); }, [theme]);
  useEffect(() => {
    writePreference('ecp-user-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 1040) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 1040px)').matches) setMobileOpen((value) => !value);
    else setCollapsed((value) => !value);
  };

  return (
    <UserI18nProvider language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme} timezone={timezone}>
      <UserSessionProvider onTimezone={setTimezone}>
        <div className={`ud${collapsed ? ' is-collapsed' : ''}`} data-theme={theme} dir={direction}>
          <UserSidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggleSidebar} onCloseMobile={() => setMobileOpen(false)} />
          <div className="ud-main">
            <UserTopbar
              theme={theme}
              onThemeToggle={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              language={language}
              onLanguageChange={setLanguage}
              onMenuToggle={toggleSidebar}
              menuOpen={mobileOpen}
            />
            <main className="ud-content" id="ud-main" tabIndex={-1}>
              <Outlet />
            </main>
          </div>
        </div>
      </UserSessionProvider>
    </UserI18nProvider>
  );
}
