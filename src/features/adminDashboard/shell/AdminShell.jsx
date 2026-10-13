import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserI18nProvider, getUserDirection } from '../../userDashboard/i18n/UserI18nContext';
import { AdminSessionProvider } from '../session/AdminSessionContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import '../../userDashboard/styles/index.css';
import '../../expertDashboard/styles/expert.css';
import '../styles/admin.css';

const readPreference = (key, fallback) => {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writePreference = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage can be blocked (private mode) */ }
};

/** Persistent layout for every /admin/* page. Same shell as the user and expert workspaces, with the "earth" admin accent. */
export default function AdminShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => readPreference('ecp-admin-theme', 'light'));
  const [language, setLanguage] = useState(() => (readPreference('ecp-admin-language', 'ar') === 'en' ? 'en' : 'ar'));
  const direction = getUserDirection(language);
  const { pathname } = useLocation();

  useEffect(() => { writePreference('ecp-admin-theme', theme); }, [theme]);
  useEffect(() => {
    writePreference('ecp-admin-language', language);
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
    <UserI18nProvider language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme}>
      <AdminSessionProvider>
        <div className={`ud ud--admin${collapsed ? ' is-collapsed' : ''}`} data-theme={theme} dir={direction}>
          <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggleSidebar} onCloseMobile={() => setMobileOpen(false)} />
          <div className="ud-main">
            <AdminTopbar theme={theme} onThemeToggle={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} language={language} onLanguageChange={setLanguage} onMenuToggle={toggleSidebar} menuOpen={mobileOpen} />
            <main className="ud-content" id="ud-main" tabIndex={-1}>
              <Outlet />
            </main>
          </div>
        </div>
      </AdminSessionProvider>
    </UserI18nProvider>
  );
}
