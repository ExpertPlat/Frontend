import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserI18nProvider, getUserDirection } from '../../userDashboard/i18n/UserI18nContext';
import { ExpertSessionProvider } from '../session/ExpertSessionContext';
import ExpertSidebar from './ExpertSidebar';
import ExpertTopbar from './ExpertTopbar';
import '../../userDashboard/styles/index.css';
import '../styles/expert.css';

const readPreference = (key, fallback) => {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writePreference = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage can be blocked (private mode) */ }
};

/** Persistent layout for every /expert/* workspace page. Same design system as the user workspace, with the copper expert accent. */
export default function ExpertShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => readPreference('ecp-expert-theme', 'light'));
  const [timezone, setTimezone] = useState(undefined);
  const [language, setLanguage] = useState(() => (readPreference('ecp-expert-language', 'ar') === 'en' ? 'en' : 'ar'));
  const direction = getUserDirection(language);
  const { pathname } = useLocation();

  useEffect(() => { writePreference('ecp-expert-theme', theme); }, [theme]);
  useEffect(() => {
    writePreference('ecp-expert-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);
  useEffect(() => { setMobileOpen(false); window.scrollTo?.(0, 0); }, [pathname]);
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
      <ExpertSessionProvider onTimezone={setTimezone}>
        <div className={`ud ud--expert${collapsed ? ' is-collapsed' : ''}`} data-theme={theme} dir={direction}>
          <ExpertSidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggleSidebar} onCloseMobile={() => setMobileOpen(false)} />
          <div className="ud-main">
            <ExpertTopbar theme={theme} onThemeToggle={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} language={language} onLanguageChange={setLanguage} onMenuToggle={toggleSidebar} menuOpen={mobileOpen} />
            <main className="ud-content" id="ud-main" tabIndex={-1}>
              <Outlet />
            </main>
          </div>
        </div>
      </ExpertSessionProvider>
    </UserI18nProvider>
  );
}
