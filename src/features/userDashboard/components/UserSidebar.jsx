import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { useUserI18n } from '../i18n/UserI18nContext';
import { useUserSession } from '../session/UserSessionContext';
import Logo from './Logo';
import NavMore from './NavMore';
import UdIcon from './UdIcon';

export const USER_NAV = [
  { id: 'home', icon: 'home', path: PATHS.USER_DASHBOARD, label: ['الرئيسية', 'Home'], match: [PATHS.USER_DASHBOARD] },
  { id: 'cases', icon: 'file', path: PATHS.USER_CASES, label: ['حالاتي', 'My cases'], match: [PATHS.USER_CASES] },
  { id: 'offers', icon: 'fileCheck', path: PATHS.USER_OFFERS, label: ['العروض والاتفاقات', 'Offers & agreements'], match: [PATHS.USER_OFFERS] },
  { id: 'appointments', icon: 'calendar', path: PATHS.USER_APPOINTMENTS, label: ['المواعيد', 'Appointments'], match: [PATHS.USER_APPOINTMENTS] },
  { id: 'payments', icon: 'card', path: PATHS.USER_PAYMENTS, label: ['المدفوعات', 'Payments'], match: [PATHS.USER_PAYMENTS] },
  { id: 'reviews', icon: 'star', path: PATHS.USER_REVIEWS, label: ['التقييمات', 'Reviews'], match: [PATHS.USER_REVIEWS] },
  { id: 'settings', icon: 'settings', path: PATHS.USER_SETTINGS, label: ['الإعدادات والخصوصية', 'Settings & privacy'], match: [PATHS.USER_SETTINGS, PATHS.USER_CONTEXTS, PATHS.USER_NOTIFICATIONS] },
];

/** Everyday actions stay visible; the rest sit under "Show more". */
export const USER_NAV_MORE = ['reviews', 'settings'];

export const activeNavId = (pathname) => {
  const found = USER_NAV.find((item) => item.match.some((base) => pathname === base || pathname.startsWith(`${base}/`)));
  return found?.id ?? 'home';
};

export default function UserSidebar({ collapsed, mobileOpen, onToggle, onCloseMobile }) {
  const { tx, tr } = useUserI18n();
  const { pathname } = useLocation();
  const session = useUserSession();
  const active = activeNavId(pathname);
  const hasUnread = session.unreadCount > 0;
  const showLabels = !collapsed || mobileOpen;
  const [moreOpen, setMoreOpen] = useState(() => USER_NAV_MORE.includes(active));
  useEffect(() => { if (USER_NAV_MORE.includes(active)) setMoreOpen(true); }, [active]);
  const renderItem = (item) => {
    const label = tx(item.label);
    const isActive = active === item.id;
    return (
      <Link key={item.id} to={item.path} className={`ud-nav__item${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined} title={showLabels ? undefined : label} onClick={onCloseMobile}>
        <span className="ud-nav__icon">
          <UdIcon name={item.icon} size={21} />
          {item.id === 'notifications' && hasUnread && <i className="ud-nav__dot" aria-label={tr('إشعارات غير مقروءة', 'Unread notifications')} />}
        </span>
        <span className="ud-nav__label">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <button
        type="button"
        className={`ud-backdrop${mobileOpen ? ' is-visible' : ''}`}
        aria-label={tr('إغلاق القائمة', 'Close menu')}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onCloseMobile}
      />
      <aside
        id="ud-sidebar"
        className={`ud-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`}
        aria-label={tr('التنقل الرئيسي', 'Main navigation')}
      >
        <div className="ud-sidebar__header">
          <Link className="ud-sidebar__brand" to={PATHS.HOME} aria-label="SolveIt">
            <Logo variant={showLabels ? 'wordmark' : 'mark'} />
          </Link>
          <button
            type="button"
            className="ud-sidebar__toggle"
            aria-label={collapsed && !mobileOpen ? tr('توسيع القائمة', 'Expand sidebar') : tr('طي القائمة', 'Collapse sidebar')}
            aria-controls="ud-sidebar"
            aria-expanded={!collapsed || mobileOpen}
            onClick={onToggle}
          >
            <UdIcon name="panel" size={20} />
          </button>
        </div>

        <nav className="ud-nav" aria-label={tr('أقسام لوحة المستخدم', 'Dashboard sections')}>
          {USER_NAV.filter((item) => !USER_NAV_MORE.includes(item.id)).map(renderItem)}
          <NavMore open={moreOpen} onToggle={() => setMoreOpen((v) => !v)} collapsed={!showLabels}>
            {USER_NAV.filter((item) => USER_NAV_MORE.includes(item.id)).map(renderItem)}
          </NavMore>
        </nav>
      </aside>
    </>
  );
}
