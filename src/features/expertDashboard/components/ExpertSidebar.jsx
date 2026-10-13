import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import Logo from '../../userDashboard/components/Logo';
import NavMore from '../../userDashboard/components/NavMore';
import UdIcon from '../../userDashboard/components/UdIcon';
import { useExpertSession } from '../session/ExpertSessionContext';

/** `locked`: needs an approved KYC (the API answers 403 for these resources until the expert is verified). */
export const EXPERT_NAV = [
  { id: 'home', icon: 'home', path: PATHS.EXPERT_DASHBOARD, label: ['الرئيسية', 'Home'], match: [PATHS.EXPERT_DASHBOARD] },
  { id: 'requests', icon: 'users', path: PATHS.EXPERT_INVITATIONS, label: ['الطلبات', 'Requests'], match: [PATHS.EXPERT_INVITATIONS, PATHS.EXPERT_PROPOSALS, PATHS.EXPERT_AGREEMENTS], locked: true },
  { id: 'bookings', icon: 'calendar', path: PATHS.EXPERT_BOOKINGS, label: ['المواعيد', 'Sessions'], match: [PATHS.EXPERT_BOOKINGS], locked: true },
  { id: 'offerings', icon: 'layers', path: PATHS.EXPERT_OFFERINGS, label: ['خدماتي', 'My services'], match: [PATHS.EXPERT_OFFERINGS], locked: true },
  { id: 'payments', icon: 'wallet', path: PATHS.EXPERT_PAYMENTS, label: ['المدفوعات', 'Payments'], match: [PATHS.EXPERT_PAYMENTS] },
  { id: 'reviews', icon: 'star', path: PATHS.EXPERT_REVIEWS, label: ['التقييمات', 'Reviews'], match: [PATHS.EXPERT_REVIEWS] },
  { id: 'profile', icon: 'user', path: PATHS.EXPERT_PROFILE, label: ['ملفي المهني', 'My profile'], match: [PATHS.EXPERT_PROFILE, PATHS.EXPERT_AVAILABILITY, PATHS.EXPERT_SCOPES], locked: true },
  { id: 'kyc', icon: 'shieldCheck', path: PATHS.EXPERT_KYC, label: ['التحقق', 'Verification'], match: [PATHS.EXPERT_KYC] },
  { id: 'notifications', icon: 'bell', path: PATHS.EXPERT_NOTIFICATIONS, label: ['الإشعارات', 'Notifications'], match: [PATHS.EXPERT_NOTIFICATIONS] },
  { id: 'settings', icon: 'settings', path: PATHS.EXPERT_SETTINGS, label: ['الإعدادات', 'Settings'], match: [PATHS.EXPERT_SETTINGS] },
];
/** Daily work stays visible; the rest sits under "Show more". Until the account is verified, Verification is promoted. */
const PRIMARY = ['home', 'requests', 'bookings', 'offerings', 'payments'];

const FLAT = EXPERT_NAV;
export const activeExpertNavId = (pathname) => {
  const found = FLAT.filter((item) => item.id !== 'home').find((item) => item.match.some((base) => pathname === base || pathname.startsWith(`${base}/`)));
  return found?.id ?? 'home';
};

export default function ExpertSidebar({ collapsed, mobileOpen, onToggle, onCloseMobile }) {
  const { tx, tr, fmtNumber } = useUserI18n();
  const { pathname } = useLocation();
  const { me, verified, pendingRequests, unreadCount } = useExpertSession();
  const active = activeExpertNavId(pathname);
  const showLabels = !collapsed || mobileOpen;
  const kycAttention = me && me.kycStatus !== 'approved' && me.kycStatus !== 'pending';
  const promoteKyc = Boolean(me) && !verified;
  const isPrimary = (item) => PRIMARY.includes(item.id) || (promoteKyc && item.id === 'kyc');
  const primary = EXPERT_NAV.filter(isPrimary);
  const more = EXPERT_NAV.filter((item) => !isPrimary(item));
  const activeInMore = more.some((item) => item.id === active);
  const [moreOpen, setMoreOpen] = useState(activeInMore);
  useEffect(() => { if (activeInMore) setMoreOpen(true); }, [activeInMore]);
  const renderItem = (item) => {
    const label = tx(item.label);
    const isActive = active === item.id;
    const locked = item.locked && me && !verified;
    const showDot = (item.id === 'notifications' && unreadCount > 0) || (item.id === 'kyc' && kycAttention);
    return (
      <Link key={item.id} to={item.path} className={`ud-nav__item${isActive ? ' is-active' : ''}${locked ? ' is-locked' : ''}`} aria-current={isActive ? 'page' : undefined} title={showLabels ? undefined : label} onClick={onCloseMobile}>
        <span className="ud-nav__icon">
          <UdIcon name={item.icon} size={21} />
          {showDot && <i className="ud-nav__dot" aria-label={item.id === 'kyc' ? tr('يحتاج إجراءً', 'Needs action') : tr('إشعارات غير مقروءة', 'Unread notifications')} />}
        </span>
        <span className="ud-nav__label">{label}</span>
        {locked && <UdIcon name="lock" size={15} className="ex-nav__lock" />}
        {item.id === 'requests' && pendingRequests > 0 && !locked && <b className="ex-nav__badge is-peach">{fmtNumber(pendingRequests)}</b>}
      </Link>
    );
  };

  return (
    <>
      <button type="button" className={`ud-backdrop${mobileOpen ? ' is-visible' : ''}`} aria-label={tr('إغلاق القائمة', 'Close menu')} tabIndex={mobileOpen ? 0 : -1} onClick={onCloseMobile} />
      <aside id="ud-sidebar" className={`ud-sidebar ex-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`} aria-label={tr('التنقل الرئيسي', 'Main navigation')}>
        <div className="ud-sidebar__header">
          <Link className="ud-sidebar__brand" to={PATHS.HOME} aria-label="SolveIt"><Logo variant={showLabels ? 'wordmark' : 'mark'} /></Link>
          <button type="button" className="ud-sidebar__toggle" aria-label={collapsed && !mobileOpen ? tr('توسيع القائمة', 'Expand sidebar') : tr('طي القائمة', 'Collapse sidebar')} aria-controls="ud-sidebar" aria-expanded={!collapsed || mobileOpen} onClick={onToggle}>
            <UdIcon name="panel" size={20} />
          </button>
        </div>
        {showLabels && <div className="ex-sidebar__role"><UdIcon name="badgeCheck" size={15} /><span>{tr('بوابة الخبراء', 'Expert portal')}</span></div>}

        <nav className="ud-nav ex-nav" aria-label={tr('أقسام لوحة الخبير', 'Expert dashboard sections')}>
          {primary.map(renderItem)}
          <NavMore open={moreOpen} onToggle={() => setMoreOpen((v) => !v)} collapsed={!showLabels}>
            {more.map(renderItem)}
          </NavMore>
        </nav>
      </aside>
    </>
  );
}
