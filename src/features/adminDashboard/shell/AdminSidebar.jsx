import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { ADMIN_PERMISSIONS as P } from '../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import Logo from '../../userDashboard/components/Logo';
import NavMore from '../../userDashboard/components/NavMore';
import UdIcon from '../../userDashboard/components/UdIcon';
import { useAdminSession } from '../session/AdminSessionContext';

/**
 * `any`: the item is shown when the admin holds at least one of these permissions (the API answers 403 otherwise).
 * `queue`: key in the session's queue counts shown as a badge.
 */
export const ADMIN_NAV = [
  { id: 'overview', icon: 'grid', path: PATHS.ADMIN_DASHBOARD, label: ['النظرة العامة', 'Overview'], match: [PATHS.ADMIN_DASHBOARD] },
  { id: 'kyc', icon: 'shieldCheck', path: PATHS.ADMIN_KYC, label: ['التحقق من الخبراء', 'Expert verification'], match: [PATHS.ADMIN_KYC], any: [P.EXPERTS_REVIEW_KYC], queue: ['kycSubmitted'] },
  { id: 'experts', icon: 'briefcase', path: PATHS.ADMIN_EXPERTS, label: ['الخبراء', 'Experts'], match: [PATHS.ADMIN_EXPERTS], any: [P.EXPERTS_VIEW_ANY] },
  { id: 'users', icon: 'users', path: PATHS.ADMIN_USERS, label: ['المستخدمون', 'Users'], match: [PATHS.ADMIN_USERS], any: [P.USERS_VIEW_ANY] },
  { id: 'cases', icon: 'file', path: PATHS.ADMIN_CASES, label: ['الحالات', 'Cases'], match: [PATHS.ADMIN_CASES], any: [P.CASES_VIEW_ANY] },
  { id: 'finance', icon: 'banknote', path: PATHS.ADMIN_FINANCE, label: ['المالية', 'Finance'], match: [PATHS.ADMIN_FINANCE], any: [P.FINANCE_VIEW, P.REFUNDS_VIEW, P.DISPUTES_VIEW, P.STRIPE_ACCOUNTS_VIEW], queue: ['refunds', 'disputes'] },
  { id: 'renewals', icon: 'refresh', path: PATHS.ADMIN_RENEWALS, label: ['تجديد النطاقات', 'Scope renewals'], match: [PATHS.ADMIN_RENEWALS], any: [P.EXPERT_RENEWALS_VIEW_ANY], queue: ['renewals'] },
  { id: 'catalog', icon: 'layers', path: PATHS.ADMIN_CATALOG, label: ['الكتالوج والخدمات', 'Catalog & services'], match: [PATHS.ADMIN_CATALOG], any: [P.CATALOG_VIEW] },
  { id: 'reviews', icon: 'star', path: PATHS.ADMIN_REVIEWS, label: ['إشراف التقييمات', 'Review moderation'], match: [PATHS.ADMIN_REVIEWS], any: [P.REVIEWS_VIEW_ANY], queue: ['reviews'] },
  { id: 'privacy', icon: 'fingerprint', path: PATHS.ADMIN_PRIVACY, label: ['الخصوصية والبيانات', 'Privacy & data'], match: [PATHS.ADMIN_PRIVACY], any: [P.DATA_REQUESTS_VIEW_ANY], queue: ['privacy'] },
  { id: 'admins', icon: 'userCheck', path: PATHS.ADMIN_SUB_ADMINS, label: ['فريق الإدارة', 'Admin team'], match: [PATHS.ADMIN_SUB_ADMINS], any: [P.ADMINS_VIEW_ANY] },
  { id: 'roles', icon: 'key', path: PATHS.ADMIN_ROLES, label: ['الأدوار والصلاحيات', 'Roles & permissions'], match: [PATHS.ADMIN_ROLES], any: [P.ROLES_VIEW_ANY] },
  { id: 'profile', icon: 'user', path: PATHS.ADMIN_PROFILE, label: ['حسابي', 'My account'], match: [PATHS.ADMIN_PROFILE] },
];

/** The daily operations stay visible; everything else sits under "Show more". */
const PRIMARY = ['overview', 'kyc', 'experts', 'users', 'cases', 'finance'];

export const activeAdminNavId = (pathname) => {
  const found = ADMIN_NAV.filter((item) => item.id !== 'overview').find((item) => item.match.some((base) => pathname === base || pathname.startsWith(`${base}/`)));
  return found?.id ?? 'overview';
};

export default function AdminSidebar({ collapsed, mobileOpen, onToggle, onCloseMobile }) {
  const { tx, tr, fmtNumber } = useUserI18n();
  const { pathname } = useLocation();
  const { canAny, queues, isSuper } = useAdminSession();
  const active = activeAdminNavId(pathname);
  const showLabels = !collapsed || mobileOpen;

  const visible = ADMIN_NAV.filter((item) => !item.any || canAny(item.any));
  const primary = visible.filter((item) => PRIMARY.includes(item.id));
  const more = visible.filter((item) => !PRIMARY.includes(item.id));
  const activeInMore = more.some((item) => item.id === active);
  const [moreOpen, setMoreOpen] = useState(activeInMore);
  useEffect(() => { if (activeInMore) setMoreOpen(true); }, [activeInMore]);

  const renderItem = (item) => {
    const label = tx(item.label);
    const isActive = active === item.id;
    const count = (item.queue || []).reduce((sum, key) => sum + (queues[key] || 0), 0);
    return (
      <Link key={item.id} to={item.path} className={`ud-nav__item${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined} title={showLabels ? undefined : label} onClick={onCloseMobile}>
        <span className="ud-nav__icon">
          <UdIcon name={item.icon} size={21} />
          {count > 0 && <i className="ud-nav__dot" aria-label={tr('يوجد عمل بانتظارك', 'Work is waiting')} />}
        </span>
        <span className="ud-nav__label">{label}</span>
        {count > 0 && <b className="ex-nav__badge is-peach">{fmtNumber(count)}</b>}
      </Link>
    );
  };

  return (
    <>
      <button type="button" className={`ud-backdrop${mobileOpen ? ' is-visible' : ''}`} aria-label={tr('إغلاق القائمة', 'Close menu')} tabIndex={mobileOpen ? 0 : -1} onClick={onCloseMobile} />
      <aside id="ud-sidebar" className={`ud-sidebar ad-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`} aria-label={tr('التنقل الرئيسي', 'Main navigation')}>
        <div className="ud-sidebar__header">
          <Link className="ud-sidebar__brand" to={PATHS.HOME} aria-label="SolveIt"><Logo variant={showLabels ? 'wordmark' : 'mark'} /></Link>
          <button type="button" className="ud-sidebar__toggle" aria-label={collapsed && !mobileOpen ? tr('توسيع القائمة', 'Expand sidebar') : tr('طي القائمة', 'Collapse sidebar')} aria-controls="ud-sidebar" aria-expanded={!collapsed || mobileOpen} onClick={onToggle}>
            <UdIcon name="panel" size={20} />
          </button>
        </div>
        {showLabels && <div className="ex-sidebar__role"><UdIcon name={isSuper ? 'shieldCheck' : 'shield'} size={15} /><span>{tr('لوحة الإدارة', 'Admin console')}</span></div>}

        <nav className="ud-nav ex-nav" aria-label={tr('أقسام لوحة الإدارة', 'Admin sections')}>
          {primary.map(renderItem)}
          {more.length > 0 && (
            <NavMore open={moreOpen} onToggle={() => setMoreOpen((value) => !value)} collapsed={!showLabels}>
              {more.map(renderItem)}
            </NavMore>
          )}
        </nav>
      </aside>
    </>
  );
}
